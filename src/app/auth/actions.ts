"use server";

import { redirect } from "next/navigation";
import { getDb } from "../../lib/db";
import { recordAuthEvent } from "../../lib/auth/audit";
import {
  EMAIL_VERIFICATION_TTL_MINUTES,
  PASSWORD_RESET_TTL_MINUTES,
  emailVerificationRequired,
  publicEmailAuthEnabled,
} from "../../lib/auth/config";
import {
  EmailDeliveryError,
  passwordChangedEmail,
  passwordResetEmail,
  sendEmail,
  verificationEmail,
} from "../../lib/auth/email";
import { consumeTimingDecoy, hashPassword, verifyPassword } from "../../lib/auth/password";
import {
  PrivateBetaAccessError,
  completeAdministrativeRecovery,
  consumePrivateBetaInvitation,
} from "../../lib/auth/private-beta";
import {
  RATE_LIMITS,
  clearRateLimit,
  consumeRateLimit,
  emailSubject,
  requestSubject,
  retryMessage,
} from "../../lib/auth/rate-limit";
import { safeInternalPath } from "../../lib/auth/redirect";
import { createSession, destroyCurrentSession, revokeUserSessions } from "../../lib/auth/session";
import { consumeToken, issueToken } from "../../lib/auth/tokens";
import {
  normalizeEmail,
  validateNewPassword,
  validateRegistration,
  type FieldErrors,
} from "../../lib/auth/validation";
import type { AuthFormState } from "../../lib/auth/form-state";

/**
 * Acciones públicas de identidad.
 *
 * Dos reglas transversales:
 *   - No se confirma nunca si una dirección tiene cuenta. Registro, recuperación y
 *     login devuelven el mismo mensaje exista o no el usuario.
 *   - Si el proveedor de correo falla, la acción falla. No decimos "revisá tu
 *     casilla" cuando el envío no ocurrió.
 */

const failure = (message: string, errors: FieldErrors = {}): AuthFormState => ({
  status: "error",
  message,
  errors,
});

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

const GENERIC_FAILURE = "No pudimos completar la operación. Probá de nuevo en un momento.";
const PRIVATE_BETA_MESSAGE =
  "Doleth está en beta privada. Para crear una cuenta necesitás una invitación personal.";

/** Traduce cualquier excepción a un mensaje seguro: nunca se filtra un stack trace. */
function safeMessage(error: unknown): string {
  if (error instanceof EmailDeliveryError) {
    return "No pudimos enviar el correo en este momento. Probá de nuevo en unos minutos.";
  }
  console.error("[auth] error no controlado", error instanceof Error ? error.name : "desconocido");
  return GENERIC_FAILURE;
}

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

export async function registerAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (!publicEmailAuthEnabled()) return failure(PRIVATE_BETA_MESSAGE);

  const input = {
    name: text(formData, "name"),
    email: text(formData, "email"),
    password: String(formData.get("password") ?? ""),
    passwordConfirmation: String(formData.get("passwordConfirmation") ?? ""),
    acceptedTerms: formData.get("acceptedTerms") === "on",
  };

  const validation = validateRegistration(input);
  if (!validation.ok) return failure("Revisá los datos marcados.", validation.errors);

  const { name, email, password } = validation.values;
  const requiresEmailVerification = emailVerificationRequired();
  let destination = `/crear-cuenta/revisa-tu-correo?email=${encodeURIComponent(email)}`;

  try {
    const subject = await requestSubject();
    const limit = await consumeRateLimit(RATE_LIMITS.register, subject);
    if (!limit.allowed) return failure(retryMessage(limit.retryAfterSeconds));

    // Segundo tope, por destinatario. Este camino manda un correo tanto si la
    // dirección es nueva como si ya existía sin verificar, así que sin él
    // alcanzaría con rotar de IP para usar el alta como relay contra una casilla
    // ajena.
    if (requiresEmailVerification) {
      const perEmail = await consumeRateLimit(RATE_LIMITS.registerEmail, await emailSubject(email));
      if (!perEmail.allowed) return failure(retryMessage(perEmail.retryAfterSeconds));
    }

    const db = getDb();
    const existing = await db.user.findUnique({ where: { email } });

    if (existing) {
      // No revelamos que la dirección ya tiene cuenta. Si sigue sin verificar,
      // reenviamos el enlace; si ya está activa, no hacemos nada visible.
      if (existing.status === "PENDING_VERIFICATION" && requiresEmailVerification) {
        const issued = await issueToken(existing.id, "EMAIL_VERIFICATION", EMAIL_VERIFICATION_TTL_MINUTES);
        await sendEmail(verificationEmail(email, issued.token, EMAIL_VERIFICATION_TTL_MINUTES / 60));
        await recordAuthEvent({ type: "VERIFICATION_RESENT", userId: existing.id, context: "registro_repetido" });
      } else {
        await recordAuthEvent({ type: "ACCOUNT_CREATED", email, success: false, context: "email_ya_registrado" });
      }
      if (!requiresEmailVerification) destination = "/iniciar-sesion";
    } else {
      const now = new Date();
      const user = await db.user.create({
        data: {
          name,
          email,
          passwordHash: await hashPassword(password),
          acceptedTermsAt: now,
          ...(requiresEmailVerification ? {} : { status: "ACTIVE" as const }),
        },
      });
      if (requiresEmailVerification) {
        const issued = await issueToken(user.id, "EMAIL_VERIFICATION", EMAIL_VERIFICATION_TTL_MINUTES);
        await sendEmail(verificationEmail(email, issued.token, EMAIL_VERIFICATION_TTL_MINUTES / 60));
      } else {
        await createSession(user.id);
        await db.user.update({ where: { id: user.id }, data: { lastLoginAt: now } });
        destination = "/onboarding";
      }
      await recordAuthEvent({ type: "ACCOUNT_CREATED", userId: user.id, email });
    }
  } catch (error) {
    return failure(safeMessage(error));
  }

  redirect(destination);
}

export async function resendVerificationAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!publicEmailAuthEnabled()) return failure(PRIVATE_BETA_MESSAGE);

  const email = normalizeEmail(text(formData, "email"));
  const neutral: AuthFormState = {
    status: "success",
    message: "Si esa dirección tiene una cuenta sin confirmar, te enviamos un enlace nuevo.",
    errors: {},
  };
  if (!email) return neutral;

  try {
    // La clave del bucket es la clave primaria de una tabla: con el correo en
    // claro, `RateLimitCounter` terminaba siendo un padrón de direcciones.
    const limit = await consumeRateLimit(
      RATE_LIMITS.verificationResend,
      `${await requestSubject()}:${await emailSubject(email)}`,
    );
    if (!limit.allowed) return failure(retryMessage(limit.retryAfterSeconds));

    const user = await getDb().user.findUnique({ where: { email } });
    if (user?.status === "PENDING_VERIFICATION") {
      const issued = await issueToken(user.id, "EMAIL_VERIFICATION", EMAIL_VERIFICATION_TTL_MINUTES);
      await sendEmail(verificationEmail(email, issued.token, EMAIL_VERIFICATION_TTL_MINUTES / 60));
      await recordAuthEvent({ type: "VERIFICATION_RESENT", userId: user.id });
    }
  } catch (error) {
    return failure(safeMessage(error));
  }

  return neutral;
}

// ---------------------------------------------------------------------------
// Verificación de correo
// ---------------------------------------------------------------------------

/** Consume el token y deja la sesión abierta: verificar y entrar es un solo paso. */
export async function verifyEmailAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const raw = text(formData, "token");
  let destination = "/onboarding";

  try {
    const lookup = await consumeToken(raw, "EMAIL_VERIFICATION");
    if (!lookup.ok) {
      return failure(
        lookup.reason === "expired"
          ? "El enlace venció. Pedí uno nuevo desde el formulario de abajo."
          : "Este enlace ya no sirve. Pedí uno nuevo desde el formulario de abajo.",
      );
    }

    const db = getDb();
    const user = await db.user.findUnique({ where: { id: lookup.token.userId } });
    if (!user || user.status === "DELETED") return failure("Esta cuenta ya no está disponible.");
    if (user.status === "SUSPENDED") return failure("Esta cuenta está suspendida. Escribinos para revisarla.");

    if (user.status === "PENDING_VERIFICATION") {
      await db.user.update({
        where: { id: user.id },
        data: { status: "ACTIVE", emailVerifiedAt: new Date() },
      });
      await recordAuthEvent({ type: "EMAIL_VERIFIED", userId: user.id });
    }

    await createSession(user.id);
    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    destination = user.onboardingCompletedAt ? "/ahora" : "/onboarding";
  } catch (error) {
    return failure(safeMessage(error));
  }

  redirect(destination);
}

// ---------------------------------------------------------------------------
// Inicio y cierre de sesión
// ---------------------------------------------------------------------------

const LOGIN_GENERIC_ERROR = "Correo o contraseña incorrectos.";

export async function loginAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = normalizeEmail(text(formData, "email"));
  const password = String(formData.get("password") ?? "");
  const destination = safeInternalPath(text(formData, "destino"));
  let target = destination;

  if (!email || !password) {
    return failure("Completá correo y contraseña.", {
      ...(email ? {} : { email: "Ingresá tu correo." }),
      ...(password ? {} : { password: "Ingresá tu contraseña." }),
    });
  }

  try {
    const subject = await requestSubject();
    const [byEmail, byIp] = await Promise.all([
      consumeRateLimit(RATE_LIMITS.login, email),
      consumeRateLimit(RATE_LIMITS.loginPerIp, subject),
    ]);
    if (!byEmail.allowed || !byIp.allowed) {
      await recordAuthEvent({ type: "LOGIN_FAILED", email, success: false, context: "rate_limit" });
      return failure(retryMessage(Math.max(byEmail.retryAfterSeconds, byIp.retryAfterSeconds)));
    }

    const db = getDb();
    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      // Mismo costo de CPU que un login real: el tiempo de respuesta no delata
      // qué direcciones existen.
      await consumeTimingDecoy(password);
      await recordAuthEvent({ type: "LOGIN_FAILED", email, success: false, context: "usuario_inexistente" });
      return failure(LOGIN_GENERIC_ERROR);
    }

    const verification = await verifyPassword(password, user.passwordHash);
    if (!verification.valid) {
      await recordAuthEvent({ type: "LOGIN_FAILED", userId: user.id, success: false, context: "password_invalida" });
      return failure(LOGIN_GENERIC_ERROR);
    }

    if (user.status === "PENDING_VERIFICATION") {
      if (emailVerificationRequired()) {
        await recordAuthEvent({ type: "LOGIN_FAILED", userId: user.id, success: false, context: "sin_verificar" });
        return {
          status: "error",
          message: "Confirmá tu correo antes de entrar. Podés pedir un enlace nuevo abajo.",
          errors: { unverified: "1" },
        };
      }
      await db.user.update({ where: { id: user.id }, data: { status: "ACTIVE" } });
    }
    if (user.status === "SUSPENDED") {
      await recordAuthEvent({ type: "LOGIN_FAILED", userId: user.id, success: false, context: "suspendida" });
      return failure("Esta cuenta está suspendida. Escribinos para revisarla.");
    }
    if (user.status === "DELETED") {
      await recordAuthEvent({ type: "LOGIN_FAILED", userId: user.id, success: false, context: "eliminada" });
      return failure("Esta cuenta ya no está disponible.");
    }

    if (verification.needsRehash) {
      await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password) } });
    }

    await createSession(user.id);
    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await Promise.all([
      clearRateLimit(RATE_LIMITS.login, email),
      recordAuthEvent({ type: "LOGIN_SUCCEEDED", userId: user.id }),
    ]);

    target = user.onboardingCompletedAt ? destination : "/onboarding";
  } catch (error) {
    return failure(safeMessage(error));
  }

  redirect(target);
}

export async function logoutAction(): Promise<void> {
  const { getSession } = await import("../../lib/auth/session");
  const session = await getSession();
  await destroyCurrentSession();
  if (session) await recordAuthEvent({ type: "LOGOUT", userId: session.user.id });
  redirect("/iniciar-sesion");
}

// ---------------------------------------------------------------------------
// Recuperación de contraseña
// ---------------------------------------------------------------------------

export async function requestPasswordResetAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!publicEmailAuthEnabled()) {
    return failure("La recuperación por correo no está disponible durante la beta privada.");
  }

  const email = normalizeEmail(text(formData, "email"));
  if (!email) return failure("Ingresá tu correo.", { email: "Ingresá tu correo." });

  // Respuesta idéntica exista o no la cuenta.
  const neutral: AuthFormState = {
    status: "success",
    message: "Si esa dirección tiene una cuenta, te enviamos un enlace para elegir una contraseña nueva.",
    errors: {},
  };

  try {
    const limit = await consumeRateLimit(RATE_LIMITS.passwordReset, `${await requestSubject()}:${email}`);
    if (!limit.allowed) return failure(retryMessage(limit.retryAfterSeconds));

    const user = await getDb().user.findUnique({ where: { email } });
    if (user && (user.status === "ACTIVE" || user.status === "PENDING_VERIFICATION")) {
      const issued = await issueToken(user.id, "PASSWORD_RESET", PASSWORD_RESET_TTL_MINUTES);
      await sendEmail(passwordResetEmail(email, issued.token, PASSWORD_RESET_TTL_MINUTES));
      await recordAuthEvent({ type: "PASSWORD_RESET_REQUESTED", userId: user.id });
    } else {
      await recordAuthEvent({ type: "PASSWORD_RESET_REQUESTED", email, success: false, context: "sin_cuenta_activa" });
    }
  } catch (error) {
    return failure(safeMessage(error));
  }

  return neutral;
}

export async function resetPasswordAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const raw = text(formData, "token");
  const validation = validateNewPassword({
    password: String(formData.get("password") ?? ""),
    passwordConfirmation: String(formData.get("passwordConfirmation") ?? ""),
  });
  if (!validation.ok) return failure("Revisá los datos marcados.", validation.errors);

  try {
    const lookup = await consumeToken(raw, "PASSWORD_RESET");
    if (!lookup.ok) {
      return failure(
        lookup.reason === "expired"
          ? "El enlace venció. Pedí uno nuevo desde “Olvidé mi contraseña”."
          : "Este enlace ya no sirve. Pedí uno nuevo desde “Olvidé mi contraseña”.",
      );
    }

    const db = getDb();
    const user = await db.user.findUnique({ where: { id: lookup.token.userId } });
    if (!user || user.status === "DELETED" || user.status === "SUSPENDED") {
      return failure("Esta cuenta ya no está disponible.");
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(validation.values.password),
        passwordChangedAt: new Date(),
        // Quien pudo abrir el correo demuestra control de la dirección.
        ...(user.status === "PENDING_VERIFICATION"
          ? { status: "ACTIVE" as const, emailVerifiedAt: new Date() }
          : {}),
      },
    });

    // Cambiar la contraseña cierra todo lo que estuviera abierto en otro lado.
    const revoked = await revokeUserSessions(user.id);
    await Promise.all([
      recordAuthEvent({ type: "PASSWORD_RESET_COMPLETED", userId: user.id }),
      recordAuthEvent({ type: "SESSIONS_REVOKED", userId: user.id, context: `restablecer:${revoked}` }),
    ]);

    // El aviso es informativo: si falla, el cambio ya es válido igual.
    await sendEmail(passwordChangedEmail(user.email)).catch(() => undefined);
  } catch (error) {
    return failure(safeMessage(error));
  }

  redirect("/restablecer-contrasena/listo");
}

// ---------------------------------------------------------------------------
// Beta privada: invitaciones y recuperación administrativa
// ---------------------------------------------------------------------------

function privateBetaFailure(error: unknown): AuthFormState {
  if (!(error instanceof PrivateBetaAccessError)) return failure(safeMessage(error));

  switch (error.code) {
    case "email_mismatch":
      return failure("Esta invitación corresponde a otro correo.", {
        email: "Usá exactamente el correo al que fue dirigida la invitación.",
      });
    case "expired":
      return failure("La invitación venció. Pedile una nueva a quien te invitó.");
    case "used":
      return failure("Esta invitación ya fue utilizada.");
    case "existing_user":
      return failure("No pudimos crear la cuenta con esta invitación.");
    default:
      return failure("Esta invitación no es válida.");
  }
}

export async function registerWithInvitationAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const token = text(formData, "token");
  const input = {
    name: text(formData, "name"),
    email: text(formData, "email"),
    password: String(formData.get("password") ?? ""),
    passwordConfirmation: String(formData.get("passwordConfirmation") ?? ""),
    acceptedTerms: formData.get("acceptedTerms") === "on",
  };
  const validation = validateRegistration(input);
  if (!validation.ok) return failure("Revisá los datos marcados.", validation.errors);
  if (!token) return failure("Abrí el enlace privado completo que recibiste.");

  const { name, email, password } = validation.values;
  let userId: string;

  try {
    const subject = await requestSubject();
    const limit = await consumeRateLimit(RATE_LIMITS.privateBetaInvite, subject);
    if (!limit.allowed) return failure(retryMessage(limit.retryAfterSeconds));

    const result = await consumePrivateBetaInvitation(getDb(), {
      token,
      email,
      name,
      passwordHash: await hashPassword(password),
      acceptedTermsAt: new Date(),
    });
    userId = result.user.id;
    await clearRateLimit(RATE_LIMITS.privateBetaInvite, subject);
  } catch (error) {
    await recordAuthEvent({
      type: "PRIVATE_BETA_INVITATION_REJECTED",
      email,
      success: false,
      context: error instanceof PrivateBetaAccessError ? error.code : "error_interno",
    });
    return privateBetaFailure(error);
  }

  try {
    await createSession(userId);
    await getDb().user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  } catch {
    // La cuenta y la invitación ya quedaron confirmadas atómicamente. Si sólo
    // falla la sesión, el usuario puede entrar con la contraseña recién elegida.
    redirect("/iniciar-sesion");
  }

  redirect("/onboarding");
}

export async function administrativeResetPasswordAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const token = text(formData, "token");
  const validation = validateNewPassword({
    password: String(formData.get("password") ?? ""),
    passwordConfirmation: String(formData.get("passwordConfirmation") ?? ""),
  });
  if (!validation.ok) return failure("Revisá los datos marcados.", validation.errors);
  if (!token) return failure("Abrí el enlace temporal completo que te compartió el administrador.");

  try {
    await completeAdministrativeRecovery(getDb(), {
      token,
      passwordHash: await hashPassword(validation.values.password),
    });
  } catch (error) {
    if (error instanceof PrivateBetaAccessError) {
      return failure(
        error.code === "expired"
          ? "El enlace temporal venció. Pedile uno nuevo al administrador."
          : "Este enlace temporal ya no sirve. Pedile uno nuevo al administrador.",
      );
    }
    return failure(safeMessage(error));
  }

  redirect("/restablecer-contrasena/listo");
}
