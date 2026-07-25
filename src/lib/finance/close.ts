// Revisión mensual (cierre informativo). Puro: recibe primitivas ya leídas del
// ledger y devuelve un resultado determinista y reconciliable. Sin acceso a
// datos, sin copy de UI, sin escritura.
//
// QUÉ ES Y QUÉ NO ES
//
// Esta revisión NO cierra nada: no bloquea el período, no crea asientos, no
// altera el ledger y no impide registrar movimientos con fecha anterior. Es una
// lectura guiada del mes con la información que ya existe. Por eso no persiste:
// un cierre guardado que después se contradice con un movimiento cargado tarde
// mentiría, y el esquema actual no tiene dónde guardar esa contradicción.
//
// RECONCILIACIÓN
//
//   cierre  = patrimonio de hoy − efecto de los movimientos posteriores al mes
//   apertura = cierre − (ingresos − gastos del mes)
//   ⇒ apertura + ingresos − gastos = cierre, por construcción.
//
// Las transferencias no participan: mueven plata entre cuentas propias y su
// efecto patrimonial es cero. Los anulados no participan. De una corrección solo
// pesa el reemplazo, porque el original queda anulado en el ledger.

import { patrimonialMovements, signedPatrimonyEffect } from "./analysis";
import { withinPeriod, type Period } from "./comparison";
import type { RealityMovement } from "./reality";

const ISO_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// ---------------------------------------------------------------------------
// Períodos revisables
// ---------------------------------------------------------------------------

export interface ClosePeriod extends Period {
  /** YYYY-MM. Identidad del período en la URL. */
  month: string;
  /** El período todavía está corriendo: hoy cae adentro. */
  open: boolean;
}

const pad = (value: number): string => String(value).padStart(2, "0");

const lastDayOfMonth = (year: number, month: number): number =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

/** Mes civil completo, del día 1 al último día real. Cruza años sin ayuda. */
export function monthPeriod(month: string, today: string): ClosePeriod {
  if (!ISO_MONTH.test(month)) throw new Error("Mes inválido.");
  if (!ISO_DATE.test(today)) throw new Error("Fecha inválida.");
  const [year, monthNumber] = month.split("-").map(Number) as [number, number];
  const days = lastDayOfMonth(year, monthNumber);
  const start = `${month}-01`;
  const end = `${month}-${pad(days)}`;
  return { month, start, end, days, open: today >= start && today <= end };
}

/** El mes anterior a `month`, cruzando el cambio de año. */
export function previousMonth(month: string): string {
  if (!ISO_MONTH.test(month)) throw new Error("Mes inválido.");
  const [year, monthNumber] = month.split("-").map(Number) as [number, number];
  return monthNumber === 1 ? `${year - 1}-12` : `${year}-${pad(monthNumber - 1)}`;
}

/**
 * Los dos períodos revisables en este corte: el mes en curso y el anterior. No
 * se admiten rangos arbitrarios; un mes civil es lo único que la persona puede
 * reconocer sin explicación.
 */
export function selectablePeriods(today: string): ClosePeriod[] {
  if (!ISO_DATE.test(today)) throw new Error("Fecha inválida.");
  const current = today.slice(0, 7);
  return [monthPeriod(current, today), monthPeriod(previousMonth(current), today)];
}

/** Normaliza el mes pedido: si no es uno de los revisables, cae al mes en curso. */
export function resolvePeriod(requested: string | undefined, today: string): ClosePeriod {
  const options = selectablePeriods(today);
  return options.find((period) => period.month === requested) ?? options[0]!;
}

// ---------------------------------------------------------------------------
// Pasos
// ---------------------------------------------------------------------------

export const CLOSE_STEPS = [
  "periodo",
  "cuentas",
  "movimientos",
  "compromisos",
  "informacion",
  "resultado",
  "resumen",
] as const;

export type CloseStepId = (typeof CLOSE_STEPS)[number];

export const CLOSE_STEP_COUNT = CLOSE_STEPS.length;

/** Índice 1-based del paso, para decir "Paso 2 de 7" sin stepper visual. */
export function stepNumber(step: CloseStepId): number {
  return CLOSE_STEPS.indexOf(step) + 1;
}

export function resolveStep(requested: string | undefined): CloseStepId {
  return (CLOSE_STEPS as readonly string[]).includes(requested ?? "")
    ? (requested as CloseStepId)
    : "periodo";
}

export function nextStep(step: CloseStepId): CloseStepId | null {
  return CLOSE_STEPS[CLOSE_STEPS.indexOf(step) + 1] ?? null;
}

export function previousStep(step: CloseStepId): CloseStepId | null {
  const index = CLOSE_STEPS.indexOf(step);
  return index > 0 ? CLOSE_STEPS[index - 1]! : null;
}

// ---------------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------------

export interface CloseAccount {
  id: string;
  name: string;
  type: string;
  archived: boolean;
  /** Saldo de hoy: saldo inicial + asientos no anulados. */
  balanceCents: bigint;
  /** Σ asientos no anulados de la cuenta dentro del período. */
  withinCents: bigint;
  /** Σ asientos no anulados de la cuenta posteriores al período. */
  afterCents: bigint;
  lastActivityOn: string | null;
}

export type ClosePaymentState = "paid" | "pending" | "overdue";

export interface ClosePayment {
  id: string;
  concept: string;
  dueOn: string;
  amountCents: bigint;
  accountName: string;
  status: "PENDING" | "PAID";
}

export interface CloseInput {
  period: ClosePeriod;
  today: string;
  /** Σ saldos de todas las cuentas hoy. */
  patrimonyNowCents: bigint;
  accounts: readonly CloseAccount[];
  /** Movimientos del período, anulados incluidos con su marca. */
  movements: readonly RealityMovement[];
  /** Pagos con vencimiento en el período + todos los pendientes vigentes. */
  payments: readonly ClosePayment[];
  /** `false` cuando la lectura de pagos falló: la revisión lo declara. */
  paymentsAvailable?: boolean;
}

// ---------------------------------------------------------------------------
// Resultado
// ---------------------------------------------------------------------------

export interface CloseAccountView {
  id: string;
  name: string;
  type: string;
  archived: boolean;
  openingCents: bigint;
  closingCents: bigint;
  variationCents: bigint;
  lastActivityOn: string | null;
  /** La cuenta no registró movimientos dentro del período. */
  withoutActivity: boolean;
}

export interface CloseMovements {
  incomeCents: bigint;
  expenseCents: bigint;
  netCents: bigint;
  transferCents: bigint;
  transferCount: number;
  incomeCount: number;
  expenseCount: number;
  voidedCount: number;
  correctedCount: number;
  /** Movimientos patrimoniales no anulados del período. */
  totalCount: number;
}

export interface ClosePayments {
  paid: ClosePayment[];
  pending: ClosePayment[];
  overdue: ClosePayment[];
  outside: ClosePayment[];
  paidCents: bigint;
  pendingCents: bigint;
  overdueCents: bigint;
  outsideCents: bigint;
}

export type CloseWarningId =
  | "period-open"
  | "no-movements"
  | "no-income"
  | "overdue"
  | "account-without-activity"
  | "archived-accounts"
  | "payments-unavailable";

export interface CloseWarning {
  id: CloseWarningId;
  /** Cuántos objetos reales sostienen la advertencia. */
  count: number;
  /** `review` pide una mirada; `info` solo declara una condición del período. */
  severity: "review" | "info";
}

export interface CloseResult {
  period: ClosePeriod;
  today: string;
  hasAccounts: boolean;
  /** Patrimonio al primer día del período. */
  openingCents: bigint;
  /** Patrimonio al último día del período. */
  closingCents: bigint;
  /** ingresos − gastos del período. */
  netCents: bigint;
  /** Efecto patrimonial de lo registrado después del período. */
  afterCents: bigint;
  accounts: CloseAccountView[];
  activeAccounts: CloseAccountView[];
  archivedAccounts: CloseAccountView[];
  movements: CloseMovements;
  payments: ClosePayments;
  paymentsAvailable: boolean;
  warnings: CloseWarning[];
  /** apertura + ingresos − gastos = cierre. Siempre debería ser `true`. */
  reconciles: boolean;
  /** El período no tiene ni un movimiento ni un saldo del que hablar. */
  empty: boolean;
}

const sum = <T>(list: readonly T[], pick: (item: T) => bigint): bigint =>
  list.reduce((total, item) => total + pick(item), 0n);

export function computeClose(input: CloseInput): CloseResult {
  const paymentsAvailable = input.paymentsAvailable ?? true;
  const periodMovements = withinPeriod(input.movements, input.period);
  const patrimonial = patrimonialMovements(periodMovements) as RealityMovement[];
  const income = patrimonial.filter((movement) => movement.type === "INCOME");
  const expense = patrimonial.filter((movement) => movement.type === "EXPENSE");
  const transfers = periodMovements.filter(
    (movement) => !movement.voided && movement.type === "TRANSFER",
  );

  const incomeCents = sum(income, (movement) => movement.amountCents);
  const expenseCents = sum(expense, (movement) => movement.amountCents);
  const netCents = incomeCents - expenseCents;

  // El patrimonio de hoy incluye todo lo posterior al período: hay que sacarlo
  // para poder decir con qué terminó el mes.
  const afterCents = input.accounts.reduce((total, account) => total + account.afterCents, 0n);
  const closingCents = input.patrimonyNowCents - afterCents;
  const openingCents = closingCents - netCents;

  const accounts: CloseAccountView[] = input.accounts.map((account) => {
    const accountClosing = account.balanceCents - account.afterCents;
    return {
      id: account.id,
      name: account.name,
      type: account.type,
      archived: account.archived,
      openingCents: accountClosing - account.withinCents,
      closingCents: accountClosing,
      variationCents: account.withinCents,
      lastActivityOn: account.lastActivityOn,
      withoutActivity: account.withinCents === 0n,
    };
  });

  const movements: CloseMovements = {
    incomeCents,
    expenseCents,
    netCents,
    transferCents: sum(transfers, (movement) => movement.amountCents),
    transferCount: transfers.length,
    incomeCount: income.length,
    expenseCount: expense.length,
    voidedCount: periodMovements.filter((movement) => movement.voided).length,
    // El original de una corrección queda anulado: se cuenta como corregido, no
    // como un gasto más. Sin ese dato el usuario vería dos importes por un hecho.
    correctedCount: periodMovements.filter((movement) => movement.corrected === true).length,
    totalCount: patrimonial.length,
  };

  const inPeriod = (payment: ClosePayment) =>
    payment.dueOn >= input.period.start && payment.dueOn <= input.period.end;
  const periodPayments = input.payments.filter(inPeriod);
  const paid = periodPayments.filter((payment) => payment.status === "PAID");
  const pendingInPeriod = periodPayments.filter((payment) => payment.status === "PENDING");
  const overdue = pendingInPeriod.filter((payment) => payment.dueOn < input.today);
  const pending = pendingInPeriod.filter((payment) => payment.dueOn >= input.today);
  const outside = input.payments.filter(
    (payment) => !inPeriod(payment) && payment.status === "PENDING",
  );
  const amount = (payment: ClosePayment) => payment.amountCents;

  const payments: ClosePayments = {
    paid,
    pending,
    overdue,
    outside,
    paidCents: sum(paid, amount),
    pendingCents: sum(pending, amount),
    overdueCents: sum(overdue, amount),
    outsideCents: sum(outside, amount),
  };

  const activeAccounts = accounts.filter((account) => !account.archived);
  const archivedAccounts = accounts.filter((account) => account.archived);
  const withoutActivity = activeAccounts.filter((account) => account.withoutActivity);

  // Advertencias honestas: ninguna bloquea la revisión y ninguna es un error.
  const warnings: CloseWarning[] = [];
  if (input.period.open) warnings.push({ id: "period-open", count: 1, severity: "info" });
  if (movements.totalCount === 0) {
    warnings.push({ id: "no-movements", count: 0, severity: "review" });
  } else if (income.length === 0) {
    warnings.push({ id: "no-income", count: 0, severity: "review" });
  }
  if (!paymentsAvailable) {
    warnings.push({ id: "payments-unavailable", count: 0, severity: "info" });
  } else if (overdue.length > 0) {
    warnings.push({ id: "overdue", count: overdue.length, severity: "review" });
  }
  if (withoutActivity.length > 0 && movements.totalCount > 0) {
    warnings.push({
      id: "account-without-activity",
      count: withoutActivity.length,
      severity: "info",
    });
  }
  if (archivedAccounts.length > 0) {
    warnings.push({ id: "archived-accounts", count: archivedAccounts.length, severity: "info" });
  }

  return {
    period: input.period,
    today: input.today,
    hasAccounts: input.accounts.length > 0,
    openingCents,
    closingCents,
    netCents,
    afterCents,
    accounts,
    activeAccounts,
    archivedAccounts,
    movements,
    payments,
    paymentsAvailable,
    warnings,
    reconciles: openingCents + incomeCents - expenseCents === closingCents,
    empty: input.accounts.length === 0 || (movements.totalCount === 0 && periodMovements.length === 0),
  };
}

/**
 * Efecto patrimonial de los movimientos posteriores a un período. Se expone para
 * que la capa de datos pueda verificar que el cierre calculado coincide con el
 * ledger sin repetir la regla.
 */
export function effectAfterPeriod(
  movements: readonly RealityMovement[],
  period: Period,
): bigint {
  return patrimonialMovements(movements.filter((movement) => movement.occurredOn > period.end))
    .reduce((total, movement) => total + signedPatrimonyEffect(movement), 0n);
}
