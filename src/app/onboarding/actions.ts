"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "../../lib/db";
import { recordAuthEvent } from "../../lib/auth/audit";
import { UnauthorizedError, requireUserForAction } from "../../lib/auth/guards";
import {
  isSupportedCurrency,
  isSupportedLocale,
  isSupportedTimeZone,
} from "../../lib/auth/validation";
import { emptyOnboardingState, type OnboardingState } from "../../lib/auth/form-state";
import { provisionUserCategories } from "../../lib/finance/provisioning";
import { parseMoneyToCents, dateOnly } from "../../lib/finance/domain";

/**
 * Onboarding en tres pasos, reanudable.
 *
 * `onboardingStep` vive en la base, así que cerrar la pestaña en el paso 2 y
 * volver mañana retoma exactamente donde se quedó. No se crea ni una cuenta ni un
 * movimiento de ejemplo: la primera cuenta la carga la persona con su saldo real.
 */

const failure = (message: string, errors: Record<string, string> = {}): OnboardingState => ({
  status: "error",
  message,
  errors,
});

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

const SESSION_EXPIRED = "Tu sesión venció. Volvé a iniciar sesión para continuar.";

function toState(error: unknown): OnboardingState {
  if (error instanceof UnauthorizedError) return failure(SESSION_EXPIRED);
  return failure(error instanceof Error ? error.message : "No pudimos guardar el cambio.");
}

export async function startOnboardingAction(): Promise<OnboardingState> {
  try {
    const user = await requireUserForAction();
    if (user.onboardingStep < 1) {
      await getDb().user.update({ where: { id: user.id }, data: { onboardingStep: 1 } });
    }
    revalidatePath("/onboarding");
    return emptyOnboardingState;
  } catch (error) {
    return toState(error);
  }
}

export async function savePreferencesAction(
  _previous: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  try {
    const user = await requireUserForAction();
    const primaryCurrency = text(formData, "primaryCurrency");
    const timeZone = text(formData, "timeZone");
    const locale = text(formData, "locale");

    const errors: Record<string, string> = {};
    if (!isSupportedCurrency(primaryCurrency)) errors.primaryCurrency = "Elegí una moneda de la lista.";
    if (!isSupportedTimeZone(timeZone)) errors.timeZone = "Elegí una zona horaria de la lista.";
    if (!isSupportedLocale(locale)) errors.locale = "Elegí un formato regional de la lista.";
    if (Object.keys(errors).length > 0) return failure("Revisá los datos marcados.", errors);

    await getDb().user.update({
      where: { id: user.id },
      data: { primaryCurrency, timeZone, locale, onboardingStep: Math.max(user.onboardingStep, 2) },
    });
    revalidatePath("/onboarding");
    return emptyOnboardingState;
  } catch (error) {
    return toState(error);
  }
}

/**
 * Crea la primera cuenta y cierra el onboarding en una sola transacción, junto con
 * el catálogo de categorías. Si algo falla, no queda un usuario a medio configurar.
 */
export async function createFirstAccountAction(
  _previous: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  try {
    const user = await requireUserForAction();
    const name = text(formData, "name");
    const type = text(formData, "type");
    const currency = (text(formData, "currency") || user.primaryCurrency).toUpperCase();
    const initialBalanceCents = parseMoneyToCents(text(formData, "initialBalance"), true);
    const balanceDate = text(formData, "balanceDate");

    const errors: Record<string, string> = {};
    if (name.length < 2 || name.length > 60) errors.name = "Usá entre 2 y 60 caracteres.";
    if (!["CASH", "BANK", "WALLET", "SAVINGS", "OTHER"].includes(type)) errors.type = "Elegí un tipo de cuenta.";
    if (!isSupportedCurrency(currency)) errors.currency = "Este corte consolida cuentas en ARS.";
    // La fecha del saldo inicial se valida aunque hoy no altere el ledger: el
    // saldo inicial es el punto de partida, no un movimiento.
    if (balanceDate) {
      try {
        dateOnly(balanceDate);
      } catch {
        errors.balanceDate = "Ingresá una fecha válida.";
      }
    }
    if (Object.keys(errors).length > 0) return failure("Revisá los datos marcados.", errors);

    const db = getDb();
    await db.$transaction(async (tx) => {
      await provisionUserCategories(user.id, tx);
      await tx.account.create({
        data: { userId: user.id, name, type: type as "CASH", currency, initialBalanceCents },
      });
      await tx.user.update({
        where: { id: user.id },
        data: { onboardingStep: 3, onboardingCompletedAt: new Date() },
      });
    });

    await recordAuthEvent({ type: "ONBOARDING_COMPLETED", userId: user.id });
    revalidatePath("/onboarding");
    revalidatePath("/ahora");
    return emptyOnboardingState;
  } catch (error) {
    return toState(error);
  }
}

export async function backToStepAction(formData: FormData): Promise<void> {
  const user = await requireUserForAction();
  const step = Number(text(formData, "step"));
  if (!Number.isSafeInteger(step) || step < 0 || step > 2) throw new Error("Paso inválido.");
  // No se puede retroceder una vez terminado: eso sería reabrir la configuración.
  if (user.onboardingCompletedAt) throw new Error("La configuración inicial ya está terminada.");
  await getDb().user.update({ where: { id: user.id }, data: { onboardingStep: step } });
  revalidatePath("/onboarding");
}
