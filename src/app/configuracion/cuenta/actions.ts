"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "../../../lib/db";
import { recordAuthEvent } from "../../../lib/auth/audit";
import { EMAIL_CHANGE_TTL_MINUTES } from "../../../lib/auth/config";
import {
  EmailDeliveryError,
  emailChangeEmail,
  emailChangeNoticeEmail,
  passwordChangedEmail,
  sendEmail,
} from "../../../lib/auth/email";
import { UnauthorizedError, requireSessionForAction } from "../../../lib/auth/guards";
import { hashPassword, verifyPassword } from "../../../lib/auth/password";
import { RATE_LIMITS, consumeRateLimit, retryMessage } from "../../../lib/auth/rate-limit";
import { destroyCurrentSession, getSession, revokeUserSessions } from "../../../lib/auth/session";
import { consumeToken, issueToken } from "../../../lib/auth/tokens";
import {
  emailError,
  isSupportedCurrency,
  isSupportedLocale,
  isSupportedTimeZone,
  nameError,
  normalizeEmail,
  validateNewPassword,
  type FieldErrors,
} from "../../../lib/auth/validation";
import type { AccountState } from "../../../lib/auth/form-state";

/**
 * Acciones de la cuenta.
 *
 * Todo lo que cambia una credencial pide reautenticación con la contraseña
 * actual: tener la sesión abierta no alcanza para mover el correo, la contraseña
 * ni para pedir la baja.
 */

const failure = (message: string, errors: FieldErrors = {}): AccountState => ({
  status: "error",
  message,
  errors,
});

const success = (message: string): AccountState => ({ status: "success", message, errors: {} });

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

function toState(error: unknown): AccountState {
  if (error instanceof UnauthorizedError) {
    return failure("Tu sesión venció. Volvé a iniciar sesión para continuar.");
  }
  if (error instanceof EmailDeliveryError) {
    return failure("No pudimos enviar el correo en este momento. Probá de nuevo en unos minutos.");
  }
  console.error("[cuenta] error no controlado", error instanceof Error ? error.name : "desconocido");
  return failure("No pudimos completar la operación. Probá de nuevo en un momento.");
}

const WRONG_PASSWORD = "La contraseña actual no coincide.";

export async function updateProfileAction(_previous: AccountState, formData: FormData): Promise<AccountState> {
  try {
    const { user } = await requireSessionForAction();
    const name = text(formData, "name");
    const primaryCurrency = text(formData, "primaryCurrency");
    const timeZone = text(formData, "timeZone");
    const locale = text(formData, "locale");

    const errors: FieldErrors = {};
    const nameProblem = nameError(name);
    if (nameProblem) errors.name = nameProblem;
    if (!isSupportedCurrency(primaryCurrency)) errors.primaryCurrency = "Elegí una moneda de la lista.";
    if (!isSupportedTimeZone(timeZone)) errors.timeZone = "Elegí una zona horaria de la lista.";
    if (!isSupportedLocale(locale)) errors.locale = "Elegí un formato regional de la lista.";
    if (Object.keys(errors).length > 0) return failure("Revisá los datos marcados.", errors);

    await getDb().user.update({
      where: { id: user.id },
      data: { name: name.trim(), primaryCurrency, timeZone, locale },
    });
    await recordAuthEvent({ type: "PROFILE_UPDATED", userId: user.id });
    revalidatePath("/configuracion/cuenta");
    return success("Guardamos tus datos.");
  } catch (error) {
    return toState(error);
  }
}

export async function changePasswordAction(_previous: AccountState, formData: FormData): Promise<AccountState> {
  try {
    const { user, sessionId } = await requireSessionForAction();
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const validation = validateNewPassword({
      password: String(formData.get("password") ?? ""),
      passwordConfirmation: String(formData.get("passwordConfirmation") ?? ""),
    });
    if (!currentPassword) return failure("Ingresá tu contraseña actual.", { currentPassword: "Campo obligatorio." });
    if (!validation.ok) return failure("Revisá los datos marcados.", validation.errors);

    const verification = await verifyPassword(currentPassword, user.passwordHash);
    if (!verification.valid) return failure(WRONG_PASSWORD, { currentPassword: WRONG_PASSWORD });
    if (currentPassword === validation.values.password) {
      return failure("Elegí una contraseña distinta de la actual.", {
        password: "Tiene que ser distinta de la actual.",
      });
    }

    const changedAt = new Date();
    await getDb().user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(validation.values.password), passwordChangedAt: changedAt },
    });

    // Se cierran las demás sesiones. La actual sobrevive porque volvemos a
    // emitirla después del cambio: quien acaba de probar su contraseña sigue adentro.
    const revoked = await revokeUserSessions(user.id, sessionId);
    await getDb().session.updateMany({ where: { id: sessionId }, data: { createdAt: changedAt } });

    await Promise.all([
      recordAuthEvent({ type: "PASSWORD_CHANGED", userId: user.id }),
      recordAuthEvent({ type: "SESSIONS_REVOKED", userId: user.id, context: `cambio_password:${revoked}` }),
    ]);
    await sendEmail(passwordChangedEmail(user.email)).catch(() => undefined);

    revalidatePath("/configuracion/cuenta");
    return success(
      revoked > 0
        ? `Contraseña actualizada. Cerramos ${revoked} sesión${revoked === 1 ? "" : "es"} en otros dispositivos.`
        : "Contraseña actualizada.",
    );
  } catch (error) {
    return toState(error);
  }
}

export async function requestEmailChangeAction(
  _previous: AccountState,
  formData: FormData,
): Promise<AccountState> {
  try {
    const { user } = await requireSessionForAction();
    const password = String(formData.get("currentPassword") ?? "");
    const newEmail = normalizeEmail(text(formData, "newEmail"));

    const problem = emailError(newEmail);
    if (problem) return failure("Revisá los datos marcados.", { newEmail: problem });
    if (!password) return failure("Ingresá tu contraseña actual.", { currentPassword: "Campo obligatorio." });
    if (newEmail === user.email) {
      return failure("Ese ya es tu correo actual.", { newEmail: "Ese ya es tu correo actual." });
    }

    const verification = await verifyPassword(password, user.passwordHash);
    if (!verification.valid) return failure(WRONG_PASSWORD, { currentPassword: WRONG_PASSWORD });

    const limit = await consumeRateLimit(RATE_LIMITS.emailChange, user.id);
    if (!limit.allowed) return failure(retryMessage(limit.retryAfterSeconds));

    // No confirmamos si la dirección de destino ya está tomada: el mensaje es el
    // mismo en los dos casos y el cambio simplemente no prospera.
    const taken = await getDb().user.findUnique({ where: { email: newEmail }, select: { id: true } });
    if (!taken) {
      const issued = await issueToken(user.id, "EMAIL_CHANGE", EMAIL_CHANGE_TTL_MINUTES, newEmail);
      await sendEmail(emailChangeEmail(newEmail, issued.token, EMAIL_CHANGE_TTL_MINUTES));
      // Aviso a la dirección anterior: si el cambio no lo pidió la persona, se entera.
      await sendEmail(emailChangeNoticeEmail(user.email, newEmail)).catch(() => undefined);
    }

    await recordAuthEvent({ type: "EMAIL_CHANGE_REQUESTED", userId: user.id });
    return success(
      "Te enviamos un enlace a la dirección nueva. Tu correo actual sigue siendo el válido hasta que lo confirmes.",
    );
  } catch (error) {
    return toState(error);
  }
}

export async function confirmEmailChangeAction(
  _previous: AccountState,
  formData: FormData,
): Promise<AccountState> {
  try {
    const { user } = await requireSessionForAction();
    const lookup = await consumeToken(text(formData, "token"), "EMAIL_CHANGE");
    if (!lookup.ok) return failure("Este enlace ya no sirve. Pedí el cambio otra vez desde tu cuenta.");
    if (lookup.token.userId !== user.id) return failure("Este enlace no corresponde a tu cuenta.");

    const newEmail = lookup.token.newEmail;
    if (!newEmail) return failure("Este enlace está incompleto. Pedí el cambio otra vez.");

    const taken = await getDb().user.findUnique({ where: { email: newEmail }, select: { id: true } });
    if (taken && taken.id !== user.id) return failure("No pudimos usar esa dirección. Probá con otra.");

    await getDb().user.update({
      where: { id: user.id },
      data: { email: newEmail, emailVerifiedAt: new Date() },
    });
    await recordAuthEvent({ type: "EMAIL_CHANGED", userId: user.id });
    revalidatePath("/configuracion/cuenta");
    return success("Listo: ahora entrás con tu dirección nueva.");
  } catch (error) {
    return toState(error);
  }
}

export async function revokeOtherSessionsAction(): Promise<AccountState> {
  try {
    const { user, sessionId } = await requireSessionForAction();
    const revoked = await revokeUserSessions(user.id, sessionId);
    await recordAuthEvent({ type: "SESSIONS_REVOKED", userId: user.id, context: `manual:${revoked}` });
    revalidatePath("/configuracion/cuenta");
    return success(
      revoked > 0
        ? `Cerramos ${revoked} sesión${revoked === 1 ? "" : "es"}. Esta sigue abierta.`
        : "No había otras sesiones abiertas.",
    );
  } catch (error) {
    return toState(error);
  }
}

const DELETION_PHRASE = "ELIMINAR";

export async function requestAccountDeletionAction(
  _previous: AccountState,
  formData: FormData,
): Promise<AccountState> {
  try {
    const { user } = await requireSessionForAction();
    const password = String(formData.get("currentPassword") ?? "");
    const confirmation = text(formData, "confirmation");

    const errors: FieldErrors = {};
    if (!password) errors.currentPassword = "Campo obligatorio.";
    if (confirmation !== DELETION_PHRASE) errors.confirmation = `Escribí ${DELETION_PHRASE} para confirmar.`;
    if (Object.keys(errors).length > 0) return failure("Revisá los datos marcados.", errors);

    const verification = await verifyPassword(password, user.passwordHash);
    if (!verification.valid) return failure(WRONG_PASSWORD, { currentPassword: WRONG_PASSWORD });

    await getDb().user.update({ where: { id: user.id }, data: { deletionRequestedAt: new Date() } });
    await recordAuthEvent({ type: "ACCOUNT_DELETION_REQUESTED", userId: user.id });
    revalidatePath("/configuracion/cuenta");
    return success(
      "Registramos tu pedido de baja. Tus datos siguen intactos y podés cancelarlo mientras tanto.",
    );
  } catch (error) {
    return toState(error);
  }
}

export async function cancelAccountDeletionAction(): Promise<AccountState> {
  try {
    const { user } = await requireSessionForAction();
    await getDb().user.update({ where: { id: user.id }, data: { deletionRequestedAt: null } });
    await recordAuthEvent({ type: "ACCOUNT_DELETION_CANCELED", userId: user.id });
    revalidatePath("/configuracion/cuenta");
    return success("Cancelamos el pedido de baja.");
  } catch (error) {
    return toState(error);
  }
}

/** Cerrar sesión siempre termina en el login, incluso si la sesión ya había caído. */
export async function signOutAction(): Promise<void> {
  const session = await getSession();
  await destroyCurrentSession();
  if (session) await recordAuthEvent({ type: "LOGOUT", userId: session.user.id });
  redirect("/iniciar-sesion");
}
