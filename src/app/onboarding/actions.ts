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
import { FIXED_EXPENSE_SLOTS, ONBOARDING_STEPS } from "../../lib/auth/onboarding";
import { provisionUserCategories } from "../../lib/finance/provisioning";
import { parseMoneyToCents, dateOnly, todayInArgentina } from "../../lib/finance/domain";
import { isFxVariant, isSupportedCurrency as isSupportedDisplayCurrency } from "../../lib/finance/currency";

/**
 * Onboarding en cinco pasos, reanudable.
 *
 * `onboardingStep` vive en la base, así que cerrar la pestaña en el paso 2 y
 * volver mañana retoma exactamente donde se quedó. No se crea ni una cuenta ni un
 * movimiento de ejemplo: la primera cuenta la carga la persona con su saldo real.
 *
 * Qué se pregunta y qué no. Cada paso existe porque su respuesta **cambia algo
 * de la aplicación**: la moneda de lectura y el tipo de cambio deciden en qué
 * unidad se lee el patrimonio, la primera cuenta es el punto de partida del
 * ledger, y los gastos fijos pueblan la pantalla de lo que viene. Un
 * cuestionario que junta datos que después nadie usa alarga el camino entre
 * registrarse y ver algo útil, que es donde una app de finanzas pierde a la
 * gente.
 *
 * Los dos últimos pasos se pueden saltear. Alguien que quiere empezar a anotar
 * hoy no debería tener que enumerar sus servicios primero.
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
 * En qué unidad lee su plata, y con qué dólar.
 *
 * No es una preferencia cosmética. En Argentina "el dólar" son varios números a
 * la vez, y cuál se use cambia el patrimonio mostrado de forma material: la
 * misma persona con los mismos pesos vale distinto al oficial que al blue. Por
 * eso se pregunta en vez de asumirlo, aunque haya un valor por omisión: elegirlo
 * en silencio sería decidir por alguien cuánto tiene.
 */
export async function saveReadingPreferencesAction(
  _previous: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  try {
    const user = await requireUserForAction();
    const displayCurrency = text(formData, "displayCurrency").toUpperCase();
    const fxVariant = text(formData, "fxVariant").toUpperCase();

    const errors: Record<string, string> = {};
    // La de finanzas y no la de `auth`: acá USD es una respuesta válida, porque
    // leer el patrimonio en dólares es justamente lo que se está preguntando.
    if (!isSupportedDisplayCurrency(displayCurrency)) {
      errors.displayCurrency = "Elegí una moneda de la lista.";
    }
    if (!isFxVariant(fxVariant)) errors.fxVariant = "Elegí un tipo de cambio de la lista.";
    // `MANUAL` necesita que la persona cargue su propia cotización, y esa
    // pantalla vive en configuración. Ofrecerlo acá dejaría a alguien recién
    // llegado con un patrimonio sin poder calcularse y sin saber por qué.
    if (fxVariant === "MANUAL") {
      errors.fxVariant = "Podés cargar tu propia cotización más adelante, desde Configuración.";
    }
    if (Object.keys(errors).length > 0) return failure("Revisá los datos marcados.", errors);

    await getDb().user.update({
      where: { id: user.id },
      data: {
        displayCurrency,
        fxVariant: fxVariant as "BLUE",
        onboardingStep: Math.max(user.onboardingStep, 3),
      },
    });
    revalidatePath("/onboarding");
    return emptyOnboardingState;
  } catch (error) {
    return toState(error);
  }
}

/**
 * Crea la primera cuenta junto con el catálogo de categorías, en una sola
 * transacción. Si algo falla, no queda un usuario a medio configurar.
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
      // No cierra el onboarding: queda el paso de gastos fijos, que necesita
      // esta cuenta para poder imputarlos.
      await tx.user.update({ where: { id: user.id }, data: { onboardingStep: 4 } });
    });

    revalidatePath("/onboarding");
    return emptyOnboardingState;
  } catch (error) {
    return toState(error);
  }
}

/** Cierra el recorrido. Se llama tanto al guardar gastos fijos como al saltearlos. */
async function completeOnboarding(userId: string): Promise<void> {
  await getDb().user.update({
    where: { id: userId },
    data: { onboardingStep: ONBOARDING_STEPS, onboardingCompletedAt: new Date() },
  });
  await recordAuthEvent({ type: "ONBOARDING_COMPLETED", userId });
  revalidatePath("/onboarding");
  revalidatePath("/ahora");
  revalidatePath("/proximo");
}

/**
 * Los gastos que se repiten todos los meses.
 *
 * Se guardan como pagos previstos, que es lo que ya alimenta la pantalla de lo
 * que viene: no es un dato suelto de un formulario de bienvenida sino la primera
 * carga de una función que existe. Las filas vacías se ignoran sin protestar
 * —quien tiene un solo gasto fijo no debería pelear con dos campos vacíos— y una
 * fila a medio llenar sí se marca, porque callarla haría desaparecer un gasto
 * que la persona creyó haber cargado.
 */
export async function saveFixedExpensesAction(
  _previous: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  try {
    const user = await requireUserForAction();
    const account = await getDb().account.findFirst({
      where: { userId: user.id, status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
    });
    if (!account) return failure("Primero creá tu cuenta.");

    const errors: Record<string, string> = {};
    const planned: { concept: string; estimatedCents: bigint; dueOn: Date }[] = [];

    for (let slot = 0; slot < FIXED_EXPENSE_SLOTS; slot += 1) {
      const concept = text(formData, `concept-${slot}`);
      const amount = text(formData, `amount-${slot}`);
      const dayText = text(formData, `day-${slot}`);
      if (!concept && !amount && !dayText) continue;

      if (!concept) errors[`concept-${slot}`] = "Poné un nombre.";
      const day = Number.parseInt(dayText, 10);
      if (!Number.isSafeInteger(day) || day < 1 || day > 31) {
        errors[`day-${slot}`] = "Elegí un día del 1 al 31.";
      }

      let cents: bigint | null = null;
      try {
        cents = parseMoneyToCents(amount, false);
      } catch {
        errors[`amount-${slot}`] = "Ingresá un importe válido.";
      }
      if (cents !== null && cents <= 0n) errors[`amount-${slot}`] = "El importe tiene que ser mayor a cero.";

      if (concept && cents !== null && cents > 0n && !errors[`day-${slot}`]) {
        planned.push({ concept, estimatedCents: cents, dueOn: nextOccurrence(day) });
      }
    }

    if (Object.keys(errors).length > 0) return failure("Revisá los datos marcados.", errors);

    if (planned.length > 0) {
      await getDb().upcomingPayment.createMany({
        data: planned.map((item) => ({
          userId: user.id,
          concept: item.concept,
          estimatedCents: item.estimatedCents,
          dueOn: item.dueOn,
          frequency: "MONTHLY",
          plannedAccountId: account.id,
        })),
      });
    }

    await completeOnboarding(user.id);
    return emptyOnboardingState;
  } catch (error) {
    return toState(error);
  }
}

/**
 * Próxima vez que cae ese día del mes.
 *
 * Si el día ya pasó, apunta al mes siguiente: un pago previsto con fecha vencida
 * el mismo día que se crea nace reclamando atención por algo que no ocurrió.
 * Para días que no existen en el mes destino —un 31 en febrero— cae al último
 * día real en lugar de desbordar al mes siguiente.
 */
function nextOccurrence(day: number): Date {
  const today = new Date(`${todayInArgentina()}T00:00:00.000Z`);
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth();
  const target = day > today.getUTCDate() ? { year, month } : { year, month: month + 1 };
  const lastDay = new Date(Date.UTC(target.year, target.month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(target.year, target.month, Math.min(day, lastDay)));
}

export async function skipFixedExpensesAction(): Promise<OnboardingState> {
  try {
    const user = await requireUserForAction();
    await completeOnboarding(user.id);
    return emptyOnboardingState;
  } catch (error) {
    return toState(error);
  }
}

export async function backToStepAction(formData: FormData): Promise<void> {
  const user = await requireUserForAction();
  const step = Number(text(formData, "step"));
  if (!Number.isSafeInteger(step) || step < 0 || step > ONBOARDING_STEPS - 1) {
    throw new Error("Paso inválido.");
  }
  // No se puede retroceder una vez terminado: eso sería reabrir la configuración.
  if (user.onboardingCompletedAt) throw new Error("La configuración inicial ya está terminada.");
  await getDb().user.update({ where: { id: user.id }, data: { onboardingStep: step } });
  revalidatePath("/onboarding");
}
