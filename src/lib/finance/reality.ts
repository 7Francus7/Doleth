// Composición de /mi-realidad. Puro: recibe primitivas ya leídas del ledger y
// devuelve un resultado determinista y reconciliable. Sin acceso a datos, sin
// copy de UI.
//
// Definiciones, todas sostenidas por el esquema actual:
//
//  - Patrimonio       = Σ saldos de TODAS las cuentas (activas + archivadas).
//                       El saldo de una cuenta es saldo inicial + asientos de
//                       movimientos no anulados, así que los anulados y el
//                       original de una corrección ya quedan fuera por
//                       construcción: no hace falta descontarlos otra vez.
//  - Dinero operativo = Σ saldos de las cuentas ACTIVAS.
//  - Fuera del uso    = Σ saldos de las cuentas ARCHIVADAS. Conservan su
//                       historia y siguen dentro del patrimonio; se muestran
//                       aparte para no leerlas como dinero cotidiano.
//  - Inversiones      = tabla aparte. NUNCA se suman al patrimonio: no existe
//                       cuenta espejo, así que sumarlas sería inventar plata y
//                       restarlas sería esconderla. Dominio separado, declarado.
//  - Compromisos      = próximos pagos PENDING. No se restan del patrimonio:
//                       todavía no ocurrieron. Se parten en vencidos, dentro del
//                       horizonte y más allá del horizonte, con la misma
//                       definición de horizonte que /ahora y /progreso.
//  - Actividad        = ingresos y gastos no anulados del período, sin
//                       transferencias (una transferencia no cambia patrimonio).
//
// La calidad de la información NO usa un porcentaje inventado: son señales
// explícitas, cada una verificable contra un dato real. Cuando una lectura
// secundaria falla, sus señales salen del denominador en vez de contarse como
// incumplidas: un corte de conexión no es información faltante.

import { patrimonialMovements, signedPatrimonyEffect, type AnalysisMovement } from "./analysis";
import { withinPeriod, type Period } from "./comparison";
import {
  PROJECTION_HORIZON_DAYS,
  addCivilDays,
  compareCommitments,
  type UpcomingCommitment,
} from "./projection";

export interface RealityAccount {
  id: string;
  name: string;
  type: string;
  balanceCents: bigint;
  initialBalanceCents: bigint;
  archived: boolean;
  /** Día civil del último movimiento no anulado de la cuenta, si existe. */
  lastActivityOn: string | null;
  /** Movimientos no anulados que tocaron la cuenta. */
  movementCount: number;
}

export interface RealityInvestment {
  id: string;
  name: string;
  currentValueCents: bigint;
}

/** Movimiento del período con su categoría: permite contar los que no la tienen. */
export interface RealityMovement extends AnalysisMovement {
  categoryId: string | null;
  /** El movimiento es el original de una corrección: anulado, sin efecto vigente. */
  corrected?: boolean;
}

export interface RealityAccountView {
  id: string;
  name: string;
  type: string;
  balanceCents: bigint;
  archived: boolean;
  lastActivityOn: string | null;
  movementCount: number;
  /**
   * Participación sobre el dinero operativo, 0–100. `null` cuando no tiene
   * denominador honesto: sin dinero activo positivo, o con saldo negativo, un
   * porcentaje no significaría nada.
   */
  sharePercent: number | null;
  /** La cuenta nunca registró un movimiento: su saldo es solo el inicial. */
  onlyInitialBalance: boolean;
}

export interface RealityCommitments {
  overdueCents: bigint;
  overdueCount: number;
  horizonCents: bigint;
  horizonCount: number;
  beyondCents: bigint;
  beyondCount: number;
  totalCents: bigint;
  totalCount: number;
  horizonEnd: string;
  horizonDays: number;
  /** Vencidos + horizonte: lo mismo que descuenta la proyección de /ahora. */
  nearCents: bigint;
}

export interface RealityActivity {
  incomeCents: bigint;
  expenseCents: bigint;
  /** ingresos − gastos. Puede ser negativo: eso también es información. */
  netCents: bigint;
  transferCents: bigint;
  transferCount: number;
  /** Movimientos patrimoniales no anulados del período. */
  movementCount: number;
  voidedCount: number;
  uncategorizedCount: number;
}

export type RealitySignalId =
  | "active-account"
  | "accounts-with-origin"
  | "movements"
  | "income"
  | "upcoming"
  | "reviewed-overdue";

export interface RealitySignal {
  id: RealitySignalId;
  met: boolean;
}

export type RealityCompleteness =
  | "empty"
  | "initial"
  | "partial"
  | "sufficient"
  | "analysis-ready";

export interface RealityResult {
  /** Σ saldos de todas las cuentas. Fuente de verdad del patrimonio. */
  patrimonyCents: bigint;
  activeCents: bigint;
  archivedCents: bigint;
  investedCents: bigint;
  activeAccounts: RealityAccountView[];
  archivedAccounts: RealityAccountView[];
  activeCount: number;
  archivedCount: number;
  investmentCount: number;
  commitments: RealityCommitments;
  activity: RealityActivity;
  period: Period;
  signals: RealitySignal[];
  metSignals: number;
  totalSignals: number;
  completeness: RealityCompleteness;
  /** `false` cuando la lectura de inversiones falló: no es "no hay inversiones". */
  investmentsAvailable: boolean;
  /** `false` cuando la lectura de compromisos falló. */
  commitmentsAvailable: boolean;
  /** Señales que no se pudieron verificar por una lectura caída. */
  unverifiableSignals: RealitySignalId[];
}

export interface RealityInput {
  today: string;
  /** Período observado para la actividad: el mes en curso. */
  period: Period;
  accounts: readonly RealityAccount[];
  /** `null` cuando la lectura falló. Lista vacía significa "no hay". */
  investments: readonly RealityInvestment[] | null;
  /** `null` cuando la lectura falló. Lista vacía significa "no hay". */
  commitments: readonly UpcomingCommitment[] | null;
  /** Movimientos del período, anulados incluidos con su marca. */
  movements: readonly RealityMovement[];
  horizonDays?: number;
}

const sum = <T>(list: readonly T[], pick: (item: T) => bigint): bigint =>
  list.reduce((total, item) => total + pick(item), 0n);

const EMPTY_COMMITMENTS = (today: string, horizonDays: number): RealityCommitments => ({
  overdueCents: 0n,
  overdueCount: 0,
  horizonCents: 0n,
  horizonCount: 0,
  beyondCents: 0n,
  beyondCount: 0,
  totalCents: 0n,
  totalCount: 0,
  horizonEnd: addCivilDays(today, horizonDays),
  horizonDays,
  nearCents: 0n,
});

/**
 * Parte los compromisos en vencidos, dentro del horizonte y más allá. El
 * horizonte es el mismo que usa la proyección de /ahora: dos pantallas no pueden
 * decir números distintos de lo mismo.
 */
export function splitCommitments(
  commitments: readonly UpcomingCommitment[],
  today: string,
  horizonDays: number = PROJECTION_HORIZON_DAYS,
): RealityCommitments {
  const horizonEnd = addCivilDays(today, horizonDays);
  const ordered = [...commitments].sort(compareCommitments);
  const overdue = ordered.filter((payment) => payment.dueOn < today);
  const horizon = ordered.filter(
    (payment) => payment.dueOn >= today && payment.dueOn <= horizonEnd,
  );
  const beyond = ordered.filter((payment) => payment.dueOn > horizonEnd);
  const amount = (payment: UpcomingCommitment) => payment.amountCents;

  const overdueCents = sum(overdue, amount);
  const horizonCents = sum(horizon, amount);
  const beyondCents = sum(beyond, amount);

  return {
    overdueCents,
    overdueCount: overdue.length,
    horizonCents,
    horizonCount: horizon.length,
    beyondCents,
    beyondCount: beyond.length,
    totalCents: overdueCents + horizonCents + beyondCents,
    totalCount: ordered.length,
    horizonEnd,
    horizonDays,
    nearCents: overdueCents + horizonCents,
  };
}

function toAccountView(
  account: RealityAccount,
  operativeCents: bigint,
): RealityAccountView {
  const sharePercent =
    account.archived || operativeCents <= 0n || account.balanceCents < 0n
      ? null
      : Number((account.balanceCents * 100n) / operativeCents);

  return {
    id: account.id,
    name: account.name,
    type: account.type,
    balanceCents: account.balanceCents,
    archived: account.archived,
    lastActivityOn: account.lastActivityOn,
    movementCount: account.movementCount,
    sharePercent,
    onlyInitialBalance: account.movementCount === 0,
  };
}

/**
 * Estado de la representación según cuántas señales explícitas se cumplen. Es
 * una razón con denominador visible, no un puntaje: "4 de 6" se puede auditar,
 * "67 % completo" no.
 */
export function completenessFor(
  hasActiveAccount: boolean,
  metSignals: number,
  totalSignals: number,
): RealityCompleteness {
  if (!hasActiveAccount) return "empty";
  if (metSignals >= totalSignals) return "analysis-ready";
  if (metSignals >= totalSignals - 1) return "sufficient";
  if (metSignals >= Math.ceil(totalSignals / 2)) return "partial";
  return "initial";
}

export function computeReality(input: RealityInput): RealityResult {
  const horizonDays = input.horizonDays ?? PROJECTION_HORIZON_DAYS;
  const active = input.accounts.filter((account) => !account.archived);
  const archived = input.accounts.filter((account) => account.archived);
  const balance = (account: RealityAccount) => account.balanceCents;
  const activeCents = sum(active, balance);
  const archivedCents = sum(archived, balance);
  const patrimonyCents = activeCents + archivedCents;

  const investmentsAvailable = input.investments !== null;
  const investments = input.investments ?? [];
  const investedCents = sum(investments, (item) => item.currentValueCents);

  const commitmentsAvailable = input.commitments !== null;
  const commitments = commitmentsAvailable
    ? splitCommitments(input.commitments ?? [], input.today, horizonDays)
    : EMPTY_COMMITMENTS(input.today, horizonDays);

  // Actividad del período. Las transferencias se cuentan aparte para poder
  // nombrarlas sin que entren al resultado.
  const periodMovements = withinPeriod(input.movements, input.period);
  const live = periodMovements.filter((movement) => !movement.voided);
  const patrimonial = patrimonialMovements(periodMovements) as RealityMovement[];
  const incomeCents = sum(
    patrimonial.filter((movement) => movement.type === "INCOME"),
    (movement) => movement.amountCents,
  );
  const expenseCents = sum(
    patrimonial.filter((movement) => movement.type === "EXPENSE"),
    (movement) => movement.amountCents,
  );
  const transfers = live.filter((movement) => movement.type === "TRANSFER");

  const activity: RealityActivity = {
    incomeCents,
    expenseCents,
    netCents: incomeCents - expenseCents,
    transferCents: sum(transfers, (movement) => movement.amountCents),
    transferCount: transfers.length,
    movementCount: patrimonial.length,
    voidedCount: periodMovements.filter((movement) => movement.voided).length,
    uncategorizedCount: patrimonial.filter((movement) => movement.categoryId === null).length,
  };

  // Señales explícitas. Cada una se puede señalar con el dedo en la pantalla.
  const hasActiveAccount = active.length > 0;
  const signals: RealitySignal[] = [
    { id: "active-account", met: hasActiveAccount },
    {
      id: "accounts-with-origin",
      met:
        input.accounts.length > 0 &&
        input.accounts.every(
          (account) => account.initialBalanceCents !== 0n || account.movementCount > 0,
        ),
    },
    { id: "movements", met: activity.movementCount > 0 },
    { id: "income", met: incomeCents > 0n },
  ];

  const unverifiableSignals: RealitySignalId[] = [];
  if (commitmentsAvailable) {
    signals.push({ id: "upcoming", met: commitments.totalCount > 0 });
    signals.push({ id: "reviewed-overdue", met: commitments.overdueCount === 0 });
  } else {
    unverifiableSignals.push("upcoming", "reviewed-overdue");
  }

  const metSignals = signals.filter((signal) => signal.met).length;

  return {
    patrimonyCents,
    activeCents,
    archivedCents,
    investedCents,
    activeAccounts: active.map((account) => toAccountView(account, activeCents)),
    archivedAccounts: archived.map((account) => toAccountView(account, activeCents)),
    activeCount: active.length,
    archivedCount: archived.length,
    investmentCount: investments.length,
    commitments,
    activity,
    period: input.period,
    signals,
    metSignals,
    totalSignals: signals.length,
    completeness: completenessFor(hasActiveAccount, metSignals, signals.length),
    investmentsAvailable,
    commitmentsAvailable,
    unverifiableSignals,
  };
}

/**
 * Efecto patrimonial de un conjunto de movimientos, con las reglas del ledger.
 * Se exporta para que el cierre y la reconciliación usen exactamente la misma
 * definición que la composición.
 */
export function patrimonyEffectCents(movements: readonly AnalysisMovement[]): bigint {
  return patrimonialMovements(movements).reduce(
    (total, movement) => total + signedPatrimonyEffect(movement),
    0n,
  );
}
