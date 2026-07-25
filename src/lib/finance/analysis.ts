// Cálculo financiero puro para las superficies de análisis (/cambios, /progreso,
// /mi-realidad, /actuar). Sin acceso a datos ni copy de UI: recibe primitivas ya
// leídas del ledger y devuelve resultados deterministas y reconciliables.
//
// Reglas contables respetadas en todo este módulo:
//  - Movimientos anulados no participan de ningún cálculo.
//  - Las transferencias no alteran el patrimonio (se excluyen del cambio patrimonial).
//  - Las correcciones no se cuentan dos veces: el original queda anulado y solo
//    el reemplazo (no anulado) entra en los cálculos.
//  - El dinero se maneja en cents (bigint) hasta la capa de presentación.

export type AnalysisMovementType = "EXPENSE" | "INCOME" | "TRANSFER";

export interface AnalysisMovement {
  id: string;
  type: AnalysisMovementType;
  amountCents: bigint;
  /** Día civil argentino en formato YYYY-MM-DD. */
  occurredOn: string;
  voided: boolean;
  label: string;
  accountName: string;
}

/** Movimientos que efectivamente alteran el patrimonio: no anulados y no transferencias. */
export function patrimonialMovements(
  movements: readonly AnalysisMovement[],
): AnalysisMovement[] {
  return movements.filter((movement) => !movement.voided && movement.type !== "TRANSFER");
}

/** Efecto neto de un movimiento sobre el patrimonio, con signo. */
export function signedPatrimonyEffect(movement: AnalysisMovement): bigint {
  if (movement.type === "INCOME") return movement.amountCents;
  if (movement.type === "EXPENSE") return -movement.amountCents;
  return 0n;
}

// ---------------------------------------------------------------------------
// Cobertura simple. La comparación entre períodos de /cambios y /progreso vive
// en `comparison.ts`; acá solo queda lo que comparten todas las superficies.
// ---------------------------------------------------------------------------

export function coverageRatio(availableCents: bigint, commitmentCents: bigint): number {
  if (commitmentCents <= 0n) return 100;
  const raw = Number((availableCents * 100n) / commitmentCents);
  return Math.max(0, Math.min(100, raw));
}

// ---------------------------------------------------------------------------
// /mi-realidad — composición de la situación
// ---------------------------------------------------------------------------

export interface RealityAccount {
  id: string;
  name: string;
  type: string;
  balanceCents: bigint;
  archived: boolean;
}

export interface RealityInvestment {
  id: string;
  name: string;
  currentValueCents: bigint;
}

export type RealityCompleteness =
  | "empty"
  | "initial"
  | "partial"
  | "sufficient";

export interface RealityResult {
  /** Σ saldos de todas las cuentas (activas + archivadas). Fuente de verdad del patrimonio. */
  patrimonyCents: bigint;
  activeCents: bigint;
  archivedCents: bigint;
  committedCents: bigint;
  investedCents: bigint;
  activeCount: number;
  archivedCount: number;
  investmentCount: number;
  upcomingCount: number;
  completeness: RealityCompleteness;
  /** Señales reales cumplidas (para explicar qué falta). */
  signals: {
    hasAccount: boolean;
    hasMovements: boolean;
    hasUpcoming: boolean;
    hasIncome: boolean;
    hasInvestment: boolean;
  };
  metSignals: number;
}

export interface RealityInput {
  accounts: readonly RealityAccount[];
  investments: readonly RealityInvestment[];
  committedCents: bigint;
  upcomingCount: number;
  hasMovements: boolean;
  hasIncome: boolean;
}

export function computeReality(input: RealityInput): RealityResult {
  const active = input.accounts.filter((account) => !account.archived);
  const archived = input.accounts.filter((account) => account.archived);
  const activeCents = active.reduce((sum, account) => sum + account.balanceCents, 0n);
  const archivedCents = archived.reduce((sum, account) => sum + account.balanceCents, 0n);
  const patrimonyCents = activeCents + archivedCents;
  const investedCents = input.investments.reduce((sum, item) => sum + item.currentValueCents, 0n);

  const signals = {
    hasAccount: input.accounts.length > 0,
    hasMovements: input.hasMovements,
    hasUpcoming: input.upcomingCount > 0,
    hasIncome: input.hasIncome,
    hasInvestment: input.investments.length > 0,
  };
  const metSignals = Object.values(signals).filter(Boolean).length;
  const completeness: RealityCompleteness = !signals.hasAccount
    ? "empty"
    : metSignals <= 2
      ? "initial"
      : metSignals === 3
        ? "partial"
        : "sufficient";

  return {
    patrimonyCents,
    activeCents,
    archivedCents,
    committedCents: input.committedCents,
    investedCents,
    activeCount: active.length,
    archivedCount: archived.length,
    investmentCount: input.investments.length,
    upcomingCount: input.upcomingCount,
    completeness,
    signals,
    metSignals,
  };
}

// ---------------------------------------------------------------------------
// /actuar — motor de reglas determinista
// ---------------------------------------------------------------------------

export type ActRuleId =
  | "no-accounts"
  | "overdue-payment"
  | "uncovered-upcoming"
  | "no-movements"
  | "stable";

export interface ActPayment {
  id: string;
  concept: string;
  /** Día civil argentino YYYY-MM-DD. */
  dueOn: string;
  estimatedCents: bigint;
  accountName: string;
  accountBalanceCents: bigint;
}

export interface ActContext {
  today: string;
  hasAccounts: boolean;
  movementCount: number;
  patrimonyCents: bigint;
  /** Solo pagos PENDING. */
  pendingPayments: readonly ActPayment[];
  /** Ventana de cercanía en días para "pago próximo". */
  horizonDays?: number;
}

export interface ActDecisionResult {
  ruleId: ActRuleId;
  priority: number;
  /** Pago foco de la recomendación, si la regla lo tiene. */
  payment: ActPayment | null;
  /** Compromiso considerado (cents). */
  commitmentCents: bigint;
  /** Cobertura disponible frente al compromiso (cents). */
  coverageCents: bigint;
  /** Faltante = compromiso − cobertura, nunca negativo. */
  shortfallCents: bigint;
  /** Total pendiente dentro del horizonte (cents). */
  horizonCommitmentCents: bigint;
  /** Información suficiente para emitir una conclusión con evidencia. */
  hasEvidence: boolean;
}

function addDays(day: string, amount: number): string {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

/**
 * Selecciona una única recomendación determinista según prioridad. Nunca inventa
 * datos: si falta información, cae a la regla de menor prioridad honesta.
 */
export function selectRecommendation(context: ActContext): ActDecisionResult {
  const horizonDays = context.horizonDays ?? 7;
  const base = {
    payment: null,
    commitmentCents: 0n,
    coverageCents: 0n,
    shortfallCents: 0n,
    horizonCommitmentCents: 0n,
    hasEvidence: false,
  };

  if (!context.hasAccounts) {
    return { ruleId: "no-accounts", priority: 1, ...base };
  }

  const overdue = context.pendingPayments
    .filter((payment) => payment.dueOn < context.today)
    .sort((left, right) =>
      left.dueOn !== right.dueOn
        ? left.dueOn < right.dueOn
          ? -1
          : 1
        : Number(right.estimatedCents - left.estimatedCents),
    );

  if (overdue.length > 0) {
    const payment = overdue[0]!;
    const coverageCents = payment.accountBalanceCents < 0n
      ? 0n
      : payment.accountBalanceCents > payment.estimatedCents
        ? payment.estimatedCents
        : payment.accountBalanceCents;
    return {
      ruleId: "overdue-payment",
      priority: 2,
      payment,
      commitmentCents: payment.estimatedCents,
      coverageCents,
      shortfallCents: payment.estimatedCents - coverageCents,
      horizonCommitmentCents: payment.estimatedCents,
      hasEvidence: true,
    };
  }

  const horizonEnd = addDays(context.today, horizonDays);
  const horizon = context.pendingPayments
    .filter((payment) => payment.dueOn >= context.today && payment.dueOn <= horizonEnd)
    .sort((left, right) =>
      Number(right.estimatedCents - left.estimatedCents) || (left.dueOn < right.dueOn ? -1 : 1),
    );
  const horizonCommitmentCents = horizon.reduce((sum, payment) => sum + payment.estimatedCents, 0n);

  if (horizon.length > 0 && context.patrimonyCents < horizonCommitmentCents) {
    const coverageCents = context.patrimonyCents < 0n ? 0n : context.patrimonyCents;
    return {
      ruleId: "uncovered-upcoming",
      priority: 3,
      payment: horizon[0]!,
      commitmentCents: horizonCommitmentCents,
      coverageCents,
      shortfallCents: horizonCommitmentCents - coverageCents,
      horizonCommitmentCents,
      hasEvidence: true,
    };
  }

  if (context.movementCount === 0) {
    return { ruleId: "no-movements", priority: 4, ...base };
  }

  return {
    ruleId: "stable",
    priority: 5,
    payment: null,
    commitmentCents: horizonCommitmentCents,
    coverageCents: context.patrimonyCents < 0n ? 0n : context.patrimonyCents,
    shortfallCents: 0n,
    horizonCommitmentCents,
    hasEvidence: horizon.length > 0,
  };
}

/**
 * Acota la cobertura al compromiso para que la evidencia reconcilie sin faltantes
 * negativos: 0 ≤ cobertura ≤ compromiso y faltante = compromiso − cobertura.
 */
export function reconcileCoverage(
  commitmentCents: bigint,
  rawCoverageCents: bigint,
): { coverageCents: bigint; missingCents: bigint } {
  const coverageCents = rawCoverageCents < 0n
    ? 0n
    : rawCoverageCents > commitmentCents
      ? commitmentCents
      : rawCoverageCents;
  return { coverageCents, missingCents: commitmentCents - coverageCents };
}

/**
 * Ejecuta una lectura de lista tolerante a fallos: si la consulta rechaza (por
 * ejemplo, un corte transitorio de conexión), devuelve una lista vacía en lugar
 * de propagar el error y romper toda la vista. Reservado para dominios
 * secundarios (como inversiones) cuya ausencia degrada de forma honesta; nunca
 * para el patrimonio central. Refleja la resiliencia que ya tiene el dashboard.
 */
export async function resilientList<T>(load: () => Promise<T[]>): Promise<T[]> {
  try {
    return await load();
  } catch {
    return [];
  }
}

/**
 * Igual que `resilientList`, pero distingue "falló" de "está vacío": devuelve
 * `null` ante un error para que la pantalla pueda decir qué no pudo cargar en
 * lugar de mostrar un vacío que el usuario leería como "no hay nada".
 */
export async function resilientRead<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Idempotencia sin cambio de esquema (protección de doble-submit)
// ---------------------------------------------------------------------------

/**
 * Decide si un registro idéntico recién encontrado corresponde a un doble-envío
 * (creado dentro de la ventana) y por lo tanto debe deduplicarse en lugar de
 * crear una segunda entidad. Puro y testeable; la búsqueda del candidato ocurre
 * en la capa de datos.
 */
export function isDuplicateWithinWindow(
  existingCreatedAtMs: number,
  nowMs: number,
  windowMs = 60_000,
): boolean {
  const elapsed = nowMs - existingCreatedAtMs;
  return elapsed >= 0 && elapsed <= windowMs;
}
