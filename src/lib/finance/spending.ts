/**
 * En qué se fue la plata.
 *
 * Responde una pregunta concreta sobre un período: adónde fue lo que salió,
 * agrupado por categoría, por comercio y por cuenta, con qué cambió respecto del
 * período anterior y qué de todo eso se repite todos los meses.
 *
 * Tres decisiones ordenan el archivo, y las tres son sobre qué **no** se cuenta.
 *
 * 1. **Las transferencias no son gasto.** Mover plata de una cuenta propia a otra
 *    no la gasta. Contarlas infla el total con dinero que sigue estando, y es el
 *    error que hace que la gente desconfíe de un reporte y vuelva al Excel.
 * 2. **Lo anulado no existe.** Ya está fuera de los saldos; incluirlo acá diría
 *    otra cosa que el resto del producto.
 * 3. **Las partes suman el total exacto.** Un desglose cuyos porcentajes suman
 *    99,7 destruye la confianza en el total que está arriba, aunque cada parte
 *    esté "bien redondeada" por separado.
 *
 * Es puro: recibe movimientos ya leídos y valuados, devuelve números.
 */

import { distributeProportionally } from "./valuation";
import type { Period } from "./comparison";

/** Un movimiento listo para analizar, ya expresado en la moneda de lectura. */
export interface SpendingMovement {
  id: string;
  occurredOn: string;
  /** Importe positivo. El sentido lo da `type`. */
  amountCents: bigint;
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  voided: boolean;
  categoryId: string | null;
  categoryName: string | null;
  /** Nombre legible del comercio. Es la clave que agrupan los reportes. */
  merchant: string;
  accountId: string;
  accountName: string;
}

/**
 * Lo que efectivamente salió.
 *
 * Un solo lugar decide qué cuenta como gasto, y todo el resto del archivo lo
 * usa. Si la definición viviera repetida en cada agrupación, un cambio en una
 * dejaría los totales sin cerrar entre sí.
 */
export const spentMovements = (movements: readonly SpendingMovement[]): SpendingMovement[] =>
  movements.filter((movement) => !movement.voided && movement.type === "EXPENSE");

export const totalSpentCents = (movements: readonly SpendingMovement[]): bigint =>
  spentMovements(movements).reduce((total, movement) => total + movement.amountCents, 0n);

/** Cómo se puede mirar el gasto de un período. */
export type SpendingDimension = "category" | "merchant" | "account";

export interface SpendingSlice {
  key: string;
  label: string;
  amountCents: bigint;
  /** Participación en el total, en centésimas de punto: 3250 es 32,50 %. */
  shareBasisPoints: number;
  movementCount: number;
  /** Lo mismo en el período anterior. `null` si no hay período anterior. */
  previousCents: bigint | null;
  /** Diferencia contra el período anterior. `null` si no hay con qué comparar. */
  deltaCents: bigint | null;
}

const LABEL_WITHOUT_CATEGORY = "Sin categoría";

function keyOf(movement: SpendingMovement, dimension: SpendingDimension): { key: string; label: string } {
  if (dimension === "category") {
    return {
      key: movement.categoryId ?? "sin-categoria",
      label: movement.categoryName ?? LABEL_WITHOUT_CATEGORY,
    };
  }
  if (dimension === "account") return { key: movement.accountId, label: movement.accountName };
  // El comercio agrupa por su nombre normalizado: dos filas que dicen lo mismo
  // escrito distinto ya llegaron acá con el mismo nombre.
  const merchant = movement.merchant.trim();
  return { key: merchant.toLowerCase() || "sin-detalle", label: merchant || "Sin detalle" };
}

/**
 * Agrupa el gasto de un período por la dimensión pedida.
 *
 * Las participaciones se reparten con el mismo mecanismo que usa el resto del
 * producto para que **sumen exactamente el total**: repartir 10.000 puntos base
 * en proporción y asignar el resto a las partes más grandes, donde una
 * centésima de punto es menos visible.
 */
export function groupSpending(
  movements: readonly SpendingMovement[],
  dimension: SpendingDimension,
  previous: readonly SpendingMovement[] = [],
): SpendingSlice[] {
  const current = spentMovements(movements);
  const totals = new Map<string, { label: string; cents: bigint; count: number }>();

  for (const movement of current) {
    const { key, label } = keyOf(movement, dimension);
    const entry = totals.get(key) ?? { label, cents: 0n, count: 0 };
    entry.cents += movement.amountCents;
    entry.count += 1;
    totals.set(key, entry);
  }

  const previousTotals = new Map<string, bigint>();
  for (const movement of spentMovements(previous)) {
    const { key } = keyOf(movement, dimension);
    previousTotals.set(key, (previousTotals.get(key) ?? 0n) + movement.amountCents);
  }

  const entries = [...totals.entries()].sort((left, right) => {
    if (left[1].cents !== right[1].cents) return right[1].cents > left[1].cents ? 1 : -1;
    // Desempate estable por nombre: dos listas iguales nunca se ordenan distinto.
    return left[1].label.localeCompare(right[1].label, "es");
  });

  const shares = distributeProportionally(
    10_000n,
    entries.map(([, entry]) => entry.cents),
  );

  const hasPrevious = previous.length > 0;
  return entries.map(([key, entry], index) => {
    const previousCents = hasPrevious ? (previousTotals.get(key) ?? 0n) : null;
    return {
      key,
      label: entry.label,
      amountCents: entry.cents,
      shareBasisPoints: Number(shares[index] ?? 0n),
      movementCount: entry.count,
      previousCents,
      deltaCents: previousCents === null ? null : entry.cents - previousCents,
    };
  });
}

/**
 * Lo que más creció respecto del período anterior.
 *
 * Responde "¿por qué gasté más este mes?", que es distinto de "¿en qué gasté
 * más?". Un rubro grande y estable no explica nada; uno chico que se duplicó,
 * sí. Sólo devuelve aumentos: la pregunta es sobre lo que subió.
 */
export function biggestIncreases(slices: readonly SpendingSlice[], limit = 3): SpendingSlice[] {
  return slices
    .filter((slice) => slice.deltaCents !== null && slice.deltaCents > 0n)
    .sort((left, right) => (right.deltaCents! > left.deltaCents! ? 1 : -1))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Gastos que se repiten
// ---------------------------------------------------------------------------

export interface RecurringExpense {
  merchant: string;
  /** Cuántas veces apareció en la ventana analizada. */
  occurrences: number;
  /** Importe habitual: la mediana, no el promedio. */
  typicalCents: bigint;
  /** Días promedio entre apariciones. */
  averageIntervalDays: number;
  lastSeenOn: string;
  /** Cadencia reconocida. */
  cadence: "weekly" | "monthly";
  /** Cuánto representa por mes, para poder sumarlo con el resto. */
  monthlyCents: bigint;
}

/** Apariciones mínimas para poder hablar de repetición y no de coincidencia. */
export const MIN_RECURRENCE_OCCURRENCES = 3;

/**
 * Detecta gastos que se repiten con cadencia regular.
 *
 * Sirve para responder la pregunta que nadie se hace a tiempo: cuánto de lo que
 * gasto ya está comprometido antes de empezar el mes. Las suscripciones son el
 * caso obvio, pero también el alquiler, la cuota del gimnasio y el seguro.
 *
 * Se exige regularidad y no sólo repetición. Ir tres veces al mismo
 * supermercado en una semana no es un gasto recurrente: es hacer las compras.
 * Lo que distingue una suscripción es que los intervalos son **parejos**, así
 * que se mide la dispersión y se descarta lo irregular.
 *
 * El importe típico es la mediana y no el promedio: un cargo anómalo —un mes con
 * un extra, un ajuste— correría el promedio y haría que el número no se parezca
 * a ninguno de los cargos reales.
 */
export function detectRecurring(movements: readonly SpendingMovement[]): RecurringExpense[] {
  const byMerchant = new Map<string, SpendingMovement[]>();
  for (const movement of spentMovements(movements)) {
    const key = movement.merchant.trim().toLowerCase();
    if (!key) continue;
    byMerchant.set(key, [...(byMerchant.get(key) ?? []), movement]);
  }

  const found: RecurringExpense[] = [];

  for (const group of byMerchant.values()) {
    if (group.length < MIN_RECURRENCE_OCCURRENCES) continue;

    const sorted = [...group].sort((left, right) => left.occurredOn.localeCompare(right.occurredOn));

    /*
     * Dos cargos del mismo comercio el mismo día son **un** evento para medir
     * cadencia. Sin colapsarlos, un único cobro duplicado —o un resumen
     * importado dos veces— mete un intervalo de cero días que dispara la
     * dispersión y hace desaparecer una suscripción de doce meses impecable.
     * El importe habitual sigue calculándose sobre todos los cargos: la
     * duplicación afecta a cuándo, no a cuánto.
     */
    const distinctDays = [...new Set(sorted.map((movement) => movement.occurredOn))];
    const intervals: number[] = [];
    for (let index = 1; index < distinctDays.length; index += 1) {
      intervals.push(daysBetween(distinctDays[index - 1]!, distinctDays[index]!));
    }
    if (intervals.length < MIN_RECURRENCE_OCCURRENCES - 1) continue;

    const average = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
    const cadence = classifyCadence(average);
    if (!cadence) continue;

    // Dispersión relativa: cuánto se desvían los intervalos respecto de su
    // propio promedio. Por encima de un tercio ya no es una cadencia, es una
    // coincidencia de haber ido varias veces al mismo lugar.
    const spread = Math.sqrt(
      intervals.reduce((sum, value) => sum + (value - average) ** 2, 0) / intervals.length,
    );
    if (average === 0 || spread / average > 0.35) continue;

    const typicalCents = median(sorted.map((movement) => movement.amountCents));
    found.push({
      merchant: sorted[0]!.merchant.trim(),
      // Se cuentan los días distintos, no los cargos: "cuatro veces" tiene que
      // significar cuatro meses y no dos meses con un cobro repetido.
      occurrences: distinctDays.length,
      typicalCents,
      averageIntervalDays: Math.round(average),
      lastSeenOn: sorted[sorted.length - 1]!.occurredOn,
      cadence,
      // Semanal se lleva a mes con 30/7 para poder sumarlo junto a lo mensual.
      monthlyCents: cadence === "weekly" ? (typicalCents * 30n) / 7n : typicalCents,
    });
  }

  return found.sort((left, right) => (right.monthlyCents > left.monthlyCents ? 1 : -1));
}

/** Cuánto del gasto mensual ya está comprometido por lo que se repite. */
export const recurringMonthlyCents = (recurring: readonly RecurringExpense[]): bigint =>
  recurring.reduce((total, item) => total + item.monthlyCents, 0n);

function classifyCadence(averageDays: number): RecurringExpense["cadence"] | null {
  if (averageDays >= 5 && averageDays <= 9) return "weekly";
  if (averageDays >= 25 && averageDays <= 35) return "monthly";
  return null;
}

function daysBetween(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00.000Z`);
  const end = Date.parse(`${to}T00:00:00.000Z`);
  return Math.round((end - start) / 86_400_000);
}

function median(values: readonly bigint[]): bigint {
  const sorted = [...values].sort((left, right) => (left > right ? 1 : left < right ? -1 : 0));
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle]!;
  // Par: el promedio de los dos del medio, redondeado hacia abajo. La diferencia
  // es de un centavo y no cambia ninguna decisión.
  return (sorted[middle - 1]! + sorted[middle]!) / 2n;
}

// ---------------------------------------------------------------------------
// Lectura completa del período
// ---------------------------------------------------------------------------

export interface SpendingReport {
  period: Period;
  totalCents: bigint;
  previousTotalCents: bigint | null;
  deltaCents: bigint | null;
  movementCount: number;
  byCategory: SpendingSlice[];
  byMerchant: SpendingSlice[];
  byAccount: SpendingSlice[];
  increases: SpendingSlice[];
  recurring: RecurringExpense[];
  recurringMonthlyCents: bigint;
  /** Promedio diario del período, para comparar meses de distinto largo. */
  dailyAverageCents: bigint;
}

/**
 * Arma el reporte completo.
 *
 * `recurringWindow` es más ancha que el período: detectar una cadencia mensual
 * exige varios meses, y mirando sólo el mes en curso no se vería ni una sola
 * repetición.
 */
export function buildSpendingReport(input: {
  period: Period;
  movements: readonly SpendingMovement[];
  previousMovements: readonly SpendingMovement[];
  recurringWindow: readonly SpendingMovement[];
}): SpendingReport {
  const spent = spentMovements(input.movements);
  const totalCents = spent.reduce((total, movement) => total + movement.amountCents, 0n);
  const previousSpent = spentMovements(input.previousMovements);
  const hasPrevious = input.previousMovements.length > 0;
  const previousTotalCents = hasPrevious
    ? previousSpent.reduce((total, movement) => total + movement.amountCents, 0n)
    : null;

  const byCategory = groupSpending(input.movements, "category", input.previousMovements);
  const recurring = detectRecurring(input.recurringWindow);

  return {
    period: input.period,
    totalCents,
    previousTotalCents,
    deltaCents: previousTotalCents === null ? null : totalCents - previousTotalCents,
    movementCount: spent.length,
    byCategory,
    byMerchant: groupSpending(input.movements, "merchant", input.previousMovements),
    byAccount: groupSpending(input.movements, "account", input.previousMovements),
    increases: biggestIncreases(byCategory),
    recurring,
    recurringMonthlyCents: recurringMonthlyCents(recurring),
    dailyAverageCents: input.period.days > 0 ? totalCents / BigInt(input.period.days) : 0n,
  };
}

/** Participación en porcentaje, lista para mostrar: 3250 → "32,5 %". */
export function formatShare(basisPoints: number): string {
  const percent = basisPoints / 100;
  const text = percent >= 10 ? percent.toFixed(0) : percent.toFixed(1).replace(".", ",");
  return `${text} %`;
}
