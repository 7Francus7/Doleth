// Núcleo financiero de /ahora y /proximo. Puro: recibe primitivas ya leídas del
// ledger y devuelve resultados deterministas y reconciliables. Sin acceso a
// datos, sin copy de UI.
//
// Definiciones respaldadas por el dominio actual (schema.prisma):
//
//  - Patrimonio        = Σ saldos de TODAS las cuentas (activas + archivadas).
//                        El saldo de una cuenta es saldo inicial + asientos de
//                        movimientos no anulados, así que anulados y el original
//                        de una corrección ya quedan fuera por construcción.
//  - Dinero en cuentas = Σ saldos de las cuentas ACTIVAS. Es la base operativa.
//                        No es "líquido": el dominio no distingue liquidez, así
//                        que nunca se presenta como tal.
//  - Inversiones       = tabla aparte, nunca sumada al patrimonio. Sumarlas sería
//                        doble conteo solo si existiera una cuenta espejo; hoy no
//                        existe, y aun así se muestran separadas a propósito.
//  - Comprometido      = Σ importes de próximos pagos PENDING vencidos o dentro
//                        del horizonte. Los PAID ya son movimientos: sumarlos
//                        sería descontarlos dos veces.
//  - Proyectado        = base − comprometido. Nunca es un saldo garantizado.
//
// Limitación declarada: `UpcomingPayment.estimatedCents` es obligatorio y no hay
// discriminador fijo/estimado ni estado "omitido". No se inventan esos estados.

import { reconcileCoverage } from "./analysis";

/** Horizonte por defecto de la proyección de /ahora, en días civiles. */
export const PROJECTION_HORIZON_DAYS = 30;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export interface ProjectionAccount {
  id: string;
  name: string;
  balanceCents: bigint;
  archived: boolean;
  /**
   * ¿Es una deuda en vez de un lugar donde hay plata?
   *
   * Una tarjeta de crédito es el caso obvio: su saldo no es dinero disponible,
   * es lo que se debe. Su saldo vive en el mismo ledger y con el mismo signo que
   * cualquier otra cuenta —gastar deja el saldo en negativo— pero significa lo
   * contrario, y por eso no puede entrar en la base sobre la que se proyecta.
   *
   * Opcional para no obligar a declararlo en cada lectura que sólo tiene cuentas
   * comunes. Ausente equivale a `false`: lo que no se declara deuda, no lo es.
   */
  liability?: boolean;
}

export interface UpcomingCommitment {
  id: string;
  concept: string;
  /** Día civil argentino YYYY-MM-DD. */
  dueOn: string;
  amountCents: bigint;
  accountId: string;
  accountName: string;
  accountBalanceCents: bigint;
  /** Etiqueta libre de frecuencia. El dominio no modela recurrencia real. */
  frequency: string | null;
  /** Desempate estable cuando fecha e importe coinciden. */
  createdAtMs: number;
}

// ---------------------------------------------------------------------------
// Aritmética de días civiles (sin husos: siempre sobre YYYY-MM-DD)
// ---------------------------------------------------------------------------

export function addCivilDays(day: string, amount: number): string {
  if (!ISO_DATE.test(day)) throw new Error("Fecha inválida.");
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

/** Mes calendario siguiente al de `day`, en formato YYYY-MM. */
export function nextCivilMonth(day: string): string {
  if (!ISO_DATE.test(day)) throw new Error("Fecha inválida.");
  const [year, month] = day.split("-").map(Number) as [number, number];
  return month === 12
    ? `${year + 1}-01`
    : `${year}-${String(month + 1).padStart(2, "0")}`;
}

/**
 * El mismo día, un mes más adelante. Cuando el día no existe en el mes destino
 * (un 31 en un mes de 30) se acota al último día real: repetir un pago nunca
 * debe inventar una fecha.
 */
export function nextMonthSameDay(day: string): string {
  if (!ISO_DATE.test(day)) throw new Error("Fecha inválida.");
  const [year, month, dayOfMonth] = day.split("-").map(Number) as [number, number, number];
  const targetYear = month === 12 ? year + 1 : year;
  const targetMonth = month === 12 ? 1 : month + 1;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  const clamped = Math.min(dayOfMonth, lastDay);
  return `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(clamped).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Patrimonio y base operativa
// ---------------------------------------------------------------------------

const sumBalances = (accounts: readonly ProjectionAccount[]): bigint =>
  accounts.reduce((total, account) => total + account.balanceCents, 0n);

/**
 * Σ saldos de todas las cuentas, deudas incluidas.
 *
 * Las deudas entran con su signo natural —negativo— así que restan solas. Es la
 * definición correcta de patrimonio: lo que tenés menos lo que debés.
 */
export function patrimonyCents(accounts: readonly ProjectionAccount[]): bigint {
  return sumBalances(accounts);
}

const isMoney = (account: ProjectionAccount) => !account.archived && !account.liability;

/**
 * Σ saldos de las cuentas activas que **contienen plata**: la base sobre la que
 * se proyecta.
 *
 * Una tarjeta de crédito queda afuera, y ésa es la diferencia entera entre esta
 * función y `patrimonyCents`. Sumar el saldo de una tarjeta acá haría que gastar
 * con ella baje el número que responde "¿con cuánto cuento?", cuando gastar con
 * una tarjeta no saca un peso de ningún lado hasta que se paga el resumen. El
 * error sería doble: descontaría plata que todavía está, y volvería a
 * descontarla al pagar.
 */
export function accountsMoneyCents(accounts: readonly ProjectionAccount[]): bigint {
  return sumBalances(accounts.filter(isMoney));
}

/** Σ saldos de las cuentas archivadas: se declara cuando existe, nunca se oculta. */
export function archivedMoneyCents(accounts: readonly ProjectionAccount[]): bigint {
  return sumBalances(accounts.filter((account) => account.archived));
}

/**
 * Cuánto se debe, como número positivo.
 *
 * Se devuelve positivo porque es como se dice en voz alta: "debo 240.000", no
 * "tengo menos 240.000". El signo negativo del ledger es correcto para sumar y
 * pésimo para leer.
 *
 * Incluye las deudas archivadas: archivar una tarjeta no cancela lo que se debe
 * en ella, y ocultarlo del total sería exactamente el tipo de alivio falso que
 * Doleth no se puede permitir.
 */
export function debtCents(accounts: readonly ProjectionAccount[]): bigint {
  // Invertir el signo, sin recortar en cero: una tarjeta pagada de más deja el
  // saldo a favor y el resultado negativo, que se lee como "no debés nada, y
  // encima tenés saldo". Recortarlo a cero perdería un hecho verdadero.
  return -sumBalances(accounts.filter((account) => account.liability));
}

// ---------------------------------------------------------------------------
// Compromisos
// ---------------------------------------------------------------------------

/**
 * Orden estable de un pago frente a otro: primero el que vence antes, después el
 * de mayor importe, y por último el que se creó antes. El id cierra el empate
 * para que dos listas iguales nunca se ordenen distinto.
 */
export function compareCommitments(left: UpcomingCommitment, right: UpcomingCommitment): number {
  if (left.dueOn !== right.dueOn) return left.dueOn < right.dueOn ? -1 : 1;
  if (left.amountCents !== right.amountCents) return right.amountCents > left.amountCents ? 1 : -1;
  if (left.createdAtMs !== right.createdAtMs) return left.createdAtMs - right.createdAtMs;
  return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
}

export interface CommitmentSelection {
  /** Vencidos + dentro del horizonte, en orden cronológico estable. */
  included: UpcomingCommitment[];
  overdue: UpcomingCommitment[];
  /** Pendientes más allá del horizonte: existen, y se declaran. */
  excluded: UpcomingCommitment[];
  committedCents: bigint;
  excludedCents: bigint;
  overdueCents: bigint;
  /** Último día civil incluido en el horizonte. */
  horizonEnd: string;
  horizonDays: number;
}

/**
 * Un pago vencido sigue siendo un compromiso: se incluye aunque su fecha haya
 * quedado atrás. Los pagos más allá del horizonte no se descuentan en silencio;
 * quedan en `excluded` para que la pantalla pueda decir qué no contó.
 */
export function selectCommitments(
  payments: readonly UpcomingCommitment[],
  today: string,
  horizonDays: number = PROJECTION_HORIZON_DAYS,
): CommitmentSelection {
  const horizonEnd = addCivilDays(today, horizonDays);
  const ordered = [...payments].sort(compareCommitments);
  const overdue = ordered.filter((payment) => payment.dueOn < today);
  const included = ordered.filter((payment) => payment.dueOn <= horizonEnd);
  const excluded = ordered.filter((payment) => payment.dueOn > horizonEnd);
  const total = (list: readonly UpcomingCommitment[]) =>
    list.reduce((sum, payment) => sum + payment.amountCents, 0n);

  return {
    included,
    overdue,
    excluded,
    committedCents: total(included),
    excludedCents: total(excluded),
    overdueCents: total(overdue),
    horizonEnd,
    horizonDays,
  };
}

// ---------------------------------------------------------------------------
// Proyección
// ---------------------------------------------------------------------------

export interface Projection {
  /** Dinero en cuentas al momento de calcular. */
  baseCents: bigint;
  committedCents: bigint;
  /** base − comprometido. Puede ser negativo: eso también es información. */
  projectedCents: bigint;
  horizonEnd: string;
  horizonDays: number;
  includedCount: number;
  overdueCount: number;
  excludedCount: number;
  excludedCents: bigint;
  hasCommitments: boolean;
}

export function projectBalance(baseCents: bigint, selection: CommitmentSelection): Projection {
  return {
    baseCents,
    committedCents: selection.committedCents,
    projectedCents: baseCents - selection.committedCents,
    horizonEnd: selection.horizonEnd,
    horizonDays: selection.horizonDays,
    includedCount: selection.included.length,
    overdueCount: selection.overdue.length,
    excludedCount: selection.excluded.length,
    excludedCents: selection.excludedCents,
    hasCommitments: selection.included.length > 0,
  };
}

// ---------------------------------------------------------------------------
// Cobertura
// ---------------------------------------------------------------------------

export interface Coverage {
  /** 0–100. Sin compromisos no hay razón para alarmar: la cobertura es 100. */
  percent: number;
  coveredCents: bigint;
  missingCents: bigint;
  /** Excedente sobre el compromiso. Se explica con texto, nunca con la barra. */
  surplusCents: bigint;
  hasCommitments: boolean;
}

/**
 * Cobertura del compromiso con el dinero disponible. Nunca divide por cero y
 * nunca supera 100: el excedente se cuenta aparte para que el texto lo explique
 * sin que la barra mienta.
 */
export function computeCoverage(baseCents: bigint, committedCents: bigint): Coverage {
  if (committedCents <= 0n) {
    return {
      percent: 100,
      coveredCents: 0n,
      missingCents: 0n,
      surplusCents: baseCents > 0n ? baseCents : 0n,
      hasCommitments: false,
    };
  }

  const { coverageCents, missingCents } = reconcileCoverage(committedCents, baseCents);
  const percent = Math.max(0, Math.min(100, Number((coverageCents * 100n) / committedCents)));

  return {
    percent,
    coveredCents: coverageCents,
    missingCents,
    surplusCents: baseCents > committedCents ? baseCents - committedCents : 0n,
    hasCommitments: true,
  };
}

// ---------------------------------------------------------------------------
// Línea temporal de /proximo
// ---------------------------------------------------------------------------

export type UpcomingGroupId =
  | "overdue"
  | "today"
  | "tomorrow"
  | "this-week"
  | "rest-of-month"
  | "next-month"
  | "later";

/**
 * A qué tramo pertenece un vencimiento. El orden de evaluación es la definición:
 * un pago a tres días es "esta semana" aunque caiga en el mes siguiente.
 */
export function groupForDueDate(dueOn: string, today: string): UpcomingGroupId {
  if (dueOn < today) return "overdue";
  if (dueOn === today) return "today";
  if (dueOn === addCivilDays(today, 1)) return "tomorrow";
  if (dueOn <= addCivilDays(today, 7)) return "this-week";
  if (dueOn.slice(0, 7) === today.slice(0, 7)) return "rest-of-month";
  if (dueOn.slice(0, 7) === nextCivilMonth(today)) return "next-month";
  return "later";
}

/** Orden de lectura de los tramos: de lo más urgente a lo más lejano. */
export const UPCOMING_GROUP_ORDER: readonly UpcomingGroupId[] = [
  "overdue",
  "today",
  "tomorrow",
  "this-week",
  "rest-of-month",
  "next-month",
  "later",
];

export interface TimelineEntry {
  payment: UpcomingCommitment;
  group: UpcomingGroupId;
  /**
   * Dinero que quedaría después de pagar este y todos los pendientes anteriores
   * en orden cronológico. Solo descuenta pendientes: pagados, anulados y
   * movimientos no asociados quedan fuera por definición.
   */
  balanceAfterCents: bigint;
}

export interface TimelineGroup {
  id: UpcomingGroupId;
  entries: TimelineEntry[];
  totalCents: bigint;
  /** Saldo posterior al último pago del grupo. */
  balanceAfterCents: bigint;
}

export interface Timeline {
  /** Solo tramos con pagos: un grupo vacío no se muestra. */
  groups: TimelineGroup[];
  entries: TimelineEntry[];
  pendingCents: bigint;
  baseCents: bigint;
  /** base − Σ pendientes. Puede ser negativo. */
  finalBalanceCents: bigint;
}

/**
 * Construye la línea temporal con su saldo acumulado. El acumulado respeta el
 * orden cronológico estable, así que el saldo posterior de cada pago reconcilia
 * con la suma de todo lo anterior.
 */
export function buildTimeline(
  payments: readonly UpcomingCommitment[],
  today: string,
  baseCents: bigint,
): Timeline {
  const ordered = [...payments].sort(compareCommitments);
  let running = baseCents;
  const entries: TimelineEntry[] = ordered.map((payment) => {
    running -= payment.amountCents;
    return { payment, group: groupForDueDate(payment.dueOn, today), balanceAfterCents: running };
  });

  const groups: TimelineGroup[] = [];
  for (const id of UPCOMING_GROUP_ORDER) {
    const groupEntries = entries.filter((entry) => entry.group === id);
    if (groupEntries.length === 0) continue;
    groups.push({
      id,
      entries: groupEntries,
      totalCents: groupEntries.reduce((sum, entry) => sum + entry.payment.amountCents, 0n),
      balanceAfterCents: groupEntries[groupEntries.length - 1]!.balanceAfterCents,
    });
  }

  const pendingCents = ordered.reduce((sum, payment) => sum + payment.amountCents, 0n);
  return {
    groups,
    entries,
    pendingCents,
    baseCents,
    finalBalanceCents: baseCents - pendingCents,
  };
}

// ---------------------------------------------------------------------------
// Estado de un pago y de la pantalla
// ---------------------------------------------------------------------------

export type PaymentState = "overdue" | "due-today" | "pending" | "paid";

export function paymentState(
  dueOn: string,
  today: string,
  status: "PENDING" | "PAID",
): PaymentState {
  if (status === "PAID") return "paid";
  if (dueOn < today) return "overdue";
  if (dueOn === today) return "due-today";
  return "pending";
}

export type NowState =
  | "no-accounts"
  | "attention"
  | "uncovered"
  | "incomplete"
  | "stable";

export interface NowStateInput {
  hasAccounts: boolean;
  overdueCount: number;
  coverage: Coverage;
  hasMovements: boolean;
  hasCommitments: boolean;
}

/**
 * Un solo estado por pantalla, por prioridad. Sin cuentas no hay lectura; un
 * vencido es concreto y gana sobre todo lo demás; la falta de datos se declara
 * antes de afirmar tranquilidad.
 */
export function selectNowState(input: NowStateInput): NowState {
  if (!input.hasAccounts) return "no-accounts";
  if (input.overdueCount > 0) return "attention";
  if (input.coverage.hasCommitments && input.coverage.missingCents > 0n) return "uncovered";
  if (!input.hasMovements || !input.hasCommitments) return "incomplete";
  return "stable";
}
