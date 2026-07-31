// Comparación entre períodos para /cambios y /progreso. Puro: recibe
// movimientos ya leídos del ledger y devuelve resultados deterministas y
// reconciliables. Sin acceso a datos y sin copy de UI: los estados viajan como
// identificadores para que la capa de modelo decida cómo se dicen.
//
// Reglas contables que este módulo respeta, iguales a las del resto del sistema:
//
//  - Un movimiento anulado no participa de ningún cálculo.
//  - Una transferencia entre cuentas propias no altera el patrimonio: nunca es
//    causa de un cambio patrimonial. Se cuenta aparte para poder mencionarla.
//  - Una corrección no se duplica: el original queda anulado y solo pesa el
//    reemplazo.
//  - Comparar exige períodos equivalentes. Un mes parcial contra un mes
//    completo no es una comparación: es un sesgo, y acá se declara.

import { patrimonialMovements, signedPatrimonyEffect, type AnalysisMovement } from "./analysis";

const abs = (value: bigint): bigint => (value < 0n ? -value : value);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// ---------------------------------------------------------------------------
// Períodos civiles
// ---------------------------------------------------------------------------

/** Rango de días civiles argentinos, ambos extremos incluidos. */
export interface Period {
  start: string;
  end: string;
  days: number;
}

function shift(day: string, amount: number): string {
  if (!ISO_DATE.test(day)) throw new Error("Fecha inválida.");
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

/** Ventana que termina hoy: `days` días civiles, hoy incluido. */
export function recentPeriod(today: string, days: number): Period {
  if (days < 1) throw new Error("Un período necesita al menos un día.");
  return { start: shift(today, -(days - 1)), end: today, days };
}

/** La ventana inmediatamente anterior, de la misma longitud. Sin solapamiento. */
export function precedingPeriod(period: Period): Period {
  const end = shift(period.start, -1);
  return { start: shift(end, -(period.days - 1)), end, days: period.days };
}

const lastDayOfMonth = (year: number, month: number): number =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

/**
 * Mes en curso hasta hoy contra el **mismo tramo** del mes anterior: días 1–24
 * contra días 1–24. Cuando el mes anterior es más corto (un 31 contra febrero)
 * el tramo se acota a su último día real y el resultado lo declara con
 * `equivalent: false` para que la pantalla lo diga en vez de ocultarlo.
 */
export function equivalentMonthPeriods(today: string): {
  current: Period;
  previous: Period;
  equivalent: boolean;
} {
  if (!ISO_DATE.test(today)) throw new Error("Fecha inválida.");
  const [year, month, day] = today.split("-").map(Number) as [number, number, number];
  const previousYear = month === 1 ? year - 1 : year;
  const previousMonth = month === 1 ? 12 : month - 1;
  const previousLastDay = lastDayOfMonth(previousYear, previousMonth);
  const previousEndDay = Math.min(day, previousLastDay);
  const pad = (value: number) => String(value).padStart(2, "0");

  return {
    current: { start: `${year}-${pad(month)}-01`, end: today, days: day },
    previous: {
      start: `${previousYear}-${pad(previousMonth)}-01`,
      end: `${previousYear}-${pad(previousMonth)}-${pad(previousEndDay)}`,
      days: previousEndDay,
    },
    equivalent: previousEndDay === day,
  };
}

/** Movimientos cuyo día civil cae dentro del período. */
export function withinPeriod<T extends { occurredOn: string }>(
  movements: readonly T[],
  period: Period,
): T[] {
  return movements.filter(
    (movement) => movement.occurredOn >= period.start && movement.occurredOn <= period.end,
  );
}

// ---------------------------------------------------------------------------
// Causas
// ---------------------------------------------------------------------------

/** Movimiento con su categoría: la causa se agrupa por categoría, no por fila. */
export interface CategorizedMovement extends AnalysisMovement {
  categoryId: string | null;
  categoryName: string | null;
}

export interface CauseGroup {
  /** `category:<id>` u `other` para el resto agrupado. */
  id: string;
  label: string;
  /** Efecto con signo sobre el patrimonio. */
  effectCents: bigint;
  direction: "in" | "out";
  movementCount: number;
  /** Participación sobre el bruto movido (Σ|efecto|), 0–100. Nunca sin denominador. */
  share: number;
  /** Supera el umbral de materialidad declarado. */
  material: boolean;
  /** Agrupa causas menores: no tiene detalle navegable. */
  aggregated: boolean;
}

/** Cuántas causas se muestran antes de agrupar el resto en "Otros". */
export const MAX_VISIBLE_CAUSES = 4;

/**
 * Una causa es material cuando explica al menos la quinta parte del bruto
 * movido. El umbral es relativo a propósito: en una semana de $20.000 un gasto
 * de $6.000 explica el cambio, y en una de $2.000.000 no.
 */
export const MATERIAL_SHARE_PERCENT = 20;

function groupKey(movement: CategorizedMovement): { id: string; label: string } {
  if (movement.categoryId && movement.categoryName) {
    return { id: `category:${movement.categoryId}`, label: movement.categoryName };
  }
  // La base impide este estado para ingresos y gastos. Si una importación o
  // corrupción lo saltea, fallar evita presentar una causa inventada.
  throw new Error("Movimiento patrimonial sin categoría.");
}

/**
 * Agrupa los movimientos patrimoniales por categoría y deja las causas menores
 * en "Otros". La suma de las causas devueltas siempre reconcilia con el neto:
 * ocultar detalle nunca puede perder plata.
 */
export function summarizeCauses(
  movements: readonly CategorizedMovement[],
  maxVisible: number = MAX_VISIBLE_CAUSES,
): { causes: CauseGroup[]; hiddenCount: number; grossCents: bigint } {
  const material = patrimonialMovements(movements) as CategorizedMovement[];
  const buckets = new Map<string, { label: string; effectCents: bigint; movementCount: number }>();

  for (const movement of material) {
    const { id, label } = groupKey(movement);
    const bucket = buckets.get(id) ?? { label, effectCents: 0n, movementCount: 0 };
    bucket.effectCents += signedPatrimonyEffect(movement);
    bucket.movementCount += 1;
    buckets.set(id, bucket);
  }

  const grossCents = [...buckets.values()].reduce((sum, bucket) => sum + abs(bucket.effectCents), 0n);
  const share = (effectCents: bigint): number =>
    grossCents === 0n ? 0 : Number((abs(effectCents) * 100n) / grossCents);

  const ordered = [...buckets.entries()]
    .map(([id, bucket]) => ({ id, ...bucket }))
    .sort((left, right) => {
      const byImpact = abs(right.effectCents) - abs(left.effectCents);
      if (byImpact !== 0n) return byImpact > 0n ? 1 : -1;
      return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
    });

  const visible = ordered.slice(0, maxVisible);
  const rest = ordered.slice(maxVisible);

  const causes: CauseGroup[] = visible.map((bucket) => ({
    id: bucket.id,
    label: bucket.label,
    effectCents: bucket.effectCents,
    direction: bucket.effectCents >= 0n ? "in" : "out",
    movementCount: bucket.movementCount,
    share: share(bucket.effectCents),
    material: share(bucket.effectCents) >= MATERIAL_SHARE_PERCENT,
    aggregated: false,
  }));

  if (rest.length > 0) {
    const effectCents = rest.reduce((sum, bucket) => sum + bucket.effectCents, 0n);
    causes.push({
      id: "other",
      label: "Otros",
      effectCents,
      direction: effectCents >= 0n ? "in" : "out",
      movementCount: rest.reduce((sum, bucket) => sum + bucket.movementCount, 0),
      share: share(effectCents),
      material: false,
      aggregated: true,
    });
  }

  return { causes, hiddenCount: rest.length, grossCents };
}

// ---------------------------------------------------------------------------
// /cambios
// ---------------------------------------------------------------------------

export type ChangeState = "no-base" | "no-previous" | "partial" | "stable" | "up" | "down";

/** Piso absoluto de la tolerancia de estabilidad. */
export const STABILITY_FLOOR_CENTS = 5_000_00n;
/** Parte del patrimonio inicial por debajo de la cual el cambio no es material. */
export const STABILITY_RELATIVE_DIVISOR = 100n; // 1 %

/**
 * Tolerancia para llamar "estable" a un período. Es relativa al patrimonio con
 * un piso absoluto: sin piso, un patrimonio chico convertiría cualquier café en
 * un cambio; sin parte relativa, un patrimonio grande nunca estaría estable.
 */
export function stabilityThresholdCents(openingCents: bigint): bigint {
  const relative = abs(openingCents) / STABILITY_RELATIVE_DIVISOR;
  return relative > STABILITY_FLOOR_CENTS ? relative : STABILITY_FLOOR_CENTS;
}

export interface ChangeComparisonInput {
  movements: readonly CategorizedMovement[];
  period: Period;
  previous: Period;
  /** Patrimonio actual real (Σ saldos). Cierre de la ventana observada. */
  patrimonyCents: bigint;
  hasAccounts: boolean;
  /** Día del movimiento más antiguo registrado, si existe. */
  firstMovementDay: string | null;
}

export interface ChangeComparison {
  period: Period;
  previous: Period;
  /** Cambio patrimonial de la ventana, con signo. */
  netCents: bigint;
  previousNetCents: bigint;
  /** Neto actual − neto anterior. Compara ritmo, no saldo. */
  deltaCents: bigint;
  incomeCents: bigint;
  expenseCents: bigint;
  /** Patrimonio al inicio de la ventana: cierre − neto. Reconcilia por construcción. */
  openingCents: bigint;
  closingCents: bigint;
  /** Variación relativa. `null` cuando no hay denominador válido. */
  percent: number | null;
  state: ChangeState;
  causes: CauseGroup[];
  hiddenCauseCount: number;
  grossCents: bigint;
  movementCount: number;
  previousMovementCount: number;
  transfersCents: bigint;
  transferCount: number;
  thresholdCents: bigint;
  hasPreviousPeriod: boolean;
  /** La comparación no cubre el período anterior completo. */
  partial: boolean;
  partialReason: "no-history" | "shorter-history" | "uneven-months" | null;
}

const sumEffects = (movements: readonly AnalysisMovement[]): bigint =>
  patrimonialMovements(movements).reduce((sum, movement) => sum + signedPatrimonyEffect(movement), 0n);

export function compareChangePeriods(input: ChangeComparisonInput): ChangeComparison {
  const current = withinPeriod(input.movements, input.period);
  const previous = withinPeriod(input.movements, input.previous);

  const netCents = sumEffects(current);
  const previousNetCents = sumEffects(previous);
  const openingCents = input.patrimonyCents - netCents;

  const patrimonial = patrimonialMovements(current);
  const incomeCents = patrimonial
    .filter((movement) => movement.type === "INCOME")
    .reduce((sum, movement) => sum + movement.amountCents, 0n);
  const expenseCents = patrimonial
    .filter((movement) => movement.type === "EXPENSE")
    .reduce((sum, movement) => sum + movement.amountCents, 0n);

  const transfers = current.filter((movement) => !movement.voided && movement.type === "TRANSFER");
  const { causes, hiddenCount, grossCents } = summarizeCauses(current);

  // El historial arranca después del período anterior: la comparación existe,
  // pero no cubre el período completo y hay que decirlo.
  const historyStartsInside =
    input.firstMovementDay !== null &&
    input.firstMovementDay > input.previous.start &&
    input.firstMovementDay <= input.previous.end;
  const historyStartsAfter =
    input.firstMovementDay === null || input.firstMovementDay > input.previous.end;

  const hasPreviousPeriod = previous.length > 0;
  const partial = hasPreviousPeriod && historyStartsInside;
  const thresholdCents = stabilityThresholdCents(openingCents);

  const state: ChangeState = !input.hasAccounts
    ? "no-base"
    : !hasPreviousPeriod && historyStartsAfter
      ? "no-previous"
      : partial
        ? "partial"
        : abs(netCents) < thresholdCents
          ? "stable"
          : netCents > 0n
            ? "up"
            : "down";

  return {
    period: input.period,
    previous: input.previous,
    netCents,
    previousNetCents,
    deltaCents: netCents - previousNetCents,
    incomeCents,
    expenseCents,
    openingCents,
    closingCents: input.patrimonyCents,
    // Sin patrimonio inicial positivo un porcentaje no significa nada.
    percent: openingCents > 0n ? Number((netCents * 10000n) / openingCents) / 100 : null,
    state,
    causes,
    hiddenCauseCount: hiddenCount,
    grossCents,
    movementCount: patrimonial.length,
    previousMovementCount: patrimonialMovements(previous).length,
    transfersCents: transfers.reduce((sum, movement) => sum + movement.amountCents, 0n),
    transferCount: transfers.length,
    thresholdCents,
    hasPreviousPeriod,
    partial,
    partialReason: partial ? "shorter-history" : !hasPreviousPeriod && historyStartsAfter ? "no-history" : null,
  };
}

// ---------------------------------------------------------------------------
// /progreso
// ---------------------------------------------------------------------------

export type ProgressState = "no-base" | "first-period" | "improved" | "declined" | "flat";

export type MilestoneId =
  | "first-comparable-period"
  | "positive-patrimony"
  | "full-coverage"
  | "no-overdue"
  | "consistent-registration";

export interface Milestone {
  id: MilestoneId;
  achieved: boolean;
}

/** Días distintos con al menos un movimiento no anulado dentro del período. */
export function daysWithActivity(
  movements: readonly AnalysisMovement[],
  period: Period,
): number {
  return new Set(
    withinPeriod(movements, period)
      .filter((movement) => !movement.voided)
      .map((movement) => movement.occurredOn),
  ).size;
}

export interface ProgressComparisonInput {
  movements: readonly AnalysisMovement[];
  current: Period;
  previous: Period;
  equivalent: boolean;
  hasAccounts: boolean;
  /** Σ saldos de todas las cuentas: patrimonio. */
  patrimonyCents: bigint;
  /** Σ saldos de las cuentas activas: base de la cobertura, igual que /ahora. */
  baseCents: bigint;
  committedCents: bigint;
  overdueCount: number;
}

export interface ProgressComparison {
  current: Period;
  previous: Period;
  equivalent: boolean;
  netCents: bigint;
  previousNetCents: bigint;
  deltaCents: bigint;
  incomeCents: bigint;
  expenseCents: bigint;
  activeDays: number;
  previousActiveDays: number;
  /** Días con registro sobre días transcurridos del período. */
  consistency: number;
  coveragePercent: number;
  baseCents: bigint;
  committedCents: bigint;
  missingCents: bigint;
  hasCommitments: boolean;
  patrimonyCents: bigint;
  overdueCount: number;
  hasPreviousPeriod: boolean;
  state: ProgressState;
  milestones: Milestone[];
}

export function compareProgressPeriods(input: ProgressComparisonInput): ProgressComparison {
  const current = withinPeriod(input.movements, input.current);
  const previous = withinPeriod(input.movements, input.previous);
  const netCents = sumEffects(current);
  const previousNetCents = sumEffects(previous);
  const deltaCents = netCents - previousNetCents;

  const patrimonial = patrimonialMovements(current);
  const incomeCents = patrimonial
    .filter((movement) => movement.type === "INCOME")
    .reduce((sum, movement) => sum + movement.amountCents, 0n);
  const expenseCents = patrimonial
    .filter((movement) => movement.type === "EXPENSE")
    .reduce((sum, movement) => sum + movement.amountCents, 0n);

  const activeDays = daysWithActivity(input.movements, input.current);
  const previousActiveDays = daysWithActivity(input.movements, input.previous);
  const hasPreviousPeriod = patrimonialMovements(previous).length > 0;

  const hasCommitments = input.committedCents > 0n;
  const coveredCents = input.baseCents > input.committedCents ? input.committedCents : input.baseCents;
  const coveragePercent = !hasCommitments
    ? 100
    : Math.max(0, Math.min(100, Number(((coveredCents > 0n ? coveredCents : 0n) * 100n) / input.committedCents)));
  const missingCents = hasCommitments && input.committedCents > input.baseCents
    ? input.committedCents - (input.baseCents > 0n ? input.baseCents : 0n)
    : 0n;

  const consistency = input.current.days > 0
    ? Math.max(0, Math.min(100, Math.round((activeDays / input.current.days) * 100)))
    : 0;

  const state: ProgressState = !input.hasAccounts
    ? "no-base"
    : !hasPreviousPeriod
      ? "first-period"
      : deltaCents > 0n
        ? "improved"
        : deltaCents < 0n
          ? "declined"
          : "flat";

  // Hitos verificables contra el estado actual. No hay persistencia de hitos
  // vistos, así que se muestran como información estable y no se celebran.
  const milestones: Milestone[] = [
    { id: "first-comparable-period", achieved: hasPreviousPeriod },
    { id: "positive-patrimony", achieved: input.patrimonyCents > 0n },
    { id: "full-coverage", achieved: hasCommitments && coveragePercent >= 100 },
    { id: "no-overdue", achieved: hasCommitments && input.overdueCount === 0 },
    { id: "consistent-registration", achieved: consistency >= 50 && activeDays > 0 },
  ];

  return {
    current: input.current,
    previous: input.previous,
    equivalent: input.equivalent,
    netCents,
    previousNetCents,
    deltaCents,
    incomeCents,
    expenseCents,
    activeDays,
    previousActiveDays,
    consistency,
    coveragePercent,
    baseCents: input.baseCents,
    committedCents: input.committedCents,
    missingCents,
    hasCommitments,
    patrimonyCents: input.patrimonyCents,
    overdueCount: input.overdueCount,
    hasPreviousPeriod,
    state,
    milestones,
  };
}
