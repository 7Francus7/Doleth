/**
 * De una grilla de texto a un plan de importación revisable.
 *
 * Este módulo no escribe nada. Produce una propuesta: qué movimiento saldría de
 * cada fila, qué filas no se entienden, cuáles parecen repetidas y cuánto suma
 * todo. La persona mira eso y decide.
 *
 * Ese orden —proponer, mostrar, confirmar— es el punto entero. Un importador que
 * escribe directo convierte cada error de lectura en un movimiento falso adentro
 * del ledger, y encontrarlo después significa revisar doscientas filas a mano. La
 * previsualización cuesta una pantalla más y ahorra esa tarde.
 *
 * Es puro: recibe la grilla y lo que ya existe, devuelve el plan.
 */

import type { ColumnMapping } from "./detect";
import {
  normalizeDescription,
  parseImportAmount,
  parseImportDate,
  type DateOrder,
  type Installment,
} from "./normalize";

/**
 * Qué signo tiene un gasto en este archivo.
 *
 * Un extracto bancario escribe los gastos en negativo. Un resumen de tarjeta
 * escribe los consumos en positivo, porque desde la óptica de la tarjeta son
 * deuda que sube. Adivinarlo mal invierte **todos** los movimientos del archivo
 * a la vez, así que se declara y la previsualización lo muestra: es el error más
 * fácil de ver en pantalla y el más difícil de descubrir una vez guardado.
 */
export type SignConvention = "negative-is-expense" | "positive-is-expense";

export type RowIssue =
  | "date-missing"
  | "date-invalid"
  | "amount-missing"
  | "amount-invalid"
  | "amount-zero"
  | "description-missing";

export type DuplicateKind =
  /** Ya existe un movimiento igual en el ledger. */
  | "existing"
  /** El propio archivo trae la fila dos veces. */
  | "within-file";

export interface PlannedRow {
  /** Número de fila en el archivo original, contando desde 1. */
  sourceRowNumber: number;
  /** Celdas tal como vinieron. Es la evidencia de lo que se leyó. */
  cells: readonly string[];
  day: string | null;
  amountCents: bigint | null;
  type: "EXPENSE" | "INCOME" | null;
  merchant: string;
  processor: string | null;
  installment: Installment | null;
  rawDescription: string;
  issues: RowIssue[];
  duplicate: DuplicateKind | null;
  /** `true` cuando la fila puede convertirse en movimiento. */
  usable: boolean;
}

/** Un movimiento que ya existe, para no volver a crearlo. */
export interface ExistingMovement {
  day: string;
  amountCents: bigint;
  description: string;
}

export interface ImportPlan {
  rows: PlannedRow[];
  /** Filas que se pueden guardar: sin problemas y sin duplicar. */
  usableCount: number;
  /** Filas ilegibles. Se muestran con su motivo, nunca se descartan calladas. */
  brokenCount: number;
  duplicateCount: number;
  /** Suma de lo que sale, en positivo. Sirve para cotejar con el resumen. */
  expenseCents: bigint;
  /** Suma de lo que entra. */
  incomeCents: bigint;
  /** Rango de fechas cubierto, para reconocer si es el archivo esperado. */
  firstDay: string | null;
  lastDay: string | null;
}

export interface BuildPlanInput {
  /** Filas de datos, sin el encabezado. */
  rows: readonly string[][];
  mapping: ColumnMapping;
  dateOrder: DateOrder;
  signConvention: SignConvention;
  /** Movimientos ya registrados en el período, para detectar repetidos. */
  existing?: readonly ExistingMovement[];
}

/**
 * Clave con la que se reconoce que dos movimientos son el mismo.
 *
 * Día, importe y comercio normalizado. No incluye el texto original porque el
 * banco lo escribe distinto en el extracto y en el resumen de tarjeta —mismo
 * consumo, dos redacciones— y comparar el texto crudo dejaría pasar el duplicado
 * justo cuando más importa.
 */
const duplicateKey = (day: string, amountCents: bigint, merchant: string): string =>
  `${day}|${amountCents}|${merchant.toLowerCase()}`;

const cellAt = (cells: readonly string[], index: number | undefined): string =>
  index === undefined ? "" : (cells[index] ?? "").trim();

/**
 * Lee el importe de una fila, con las dos formas en que un archivo lo expresa.
 *
 * Una columna firmada, o el par débito/crédito donde cada lado es positivo y el
 * lado que esté lleno determina el sentido. El par tiene prioridad cuando existe
 * porque es inequívoco: no depende de ninguna convención de signo.
 */
function readAmount(
  cells: readonly string[],
  mapping: ColumnMapping,
  convention: SignConvention,
): { cents: bigint | null; invalid: boolean } {
  const hasPair = mapping.debit !== undefined || mapping.credit !== undefined;

  if (hasPair) {
    const debitText = cellAt(cells, mapping.debit);
    const creditText = cellAt(cells, mapping.credit);
    const debit = debitText === "" ? null : parseImportAmount(debitText);
    const credit = creditText === "" ? null : parseImportAmount(creditText);

    if (debitText !== "" && debit === null) return { cents: null, invalid: true };
    if (creditText !== "" && credit === null) return { cents: null, invalid: true };

    // El débito sale y el crédito entra, sin importar la convención de signo:
    // el par ya dice el sentido por sí mismo.
    if (debit !== null && debit !== 0n) return { cents: -abs(debit), invalid: false };
    if (credit !== null && credit !== 0n) return { cents: abs(credit), invalid: false };
    return { cents: null, invalid: false };
  }

  const text = cellAt(cells, mapping.amount);
  if (text === "") return { cents: null, invalid: false };
  const parsed = parseImportAmount(text);
  if (parsed === null) return { cents: null, invalid: true };

  // Con una sola columna firmada, la convención decide de qué lado cae.
  return { cents: convention === "positive-is-expense" ? -parsed : parsed, invalid: false };
}

const abs = (value: bigint) => (value < 0n ? -value : value);

/** Arma la propuesta completa a partir de la grilla ya mapeada. */
export function buildImportPlan(input: BuildPlanInput): ImportPlan {
  const existingKeys = new Set(
    (input.existing ?? []).map((movement) =>
      duplicateKey(movement.day, abs(movement.amountCents), normalizeDescription(movement.description).merchant),
    ),
  );
  const seenInFile = new Set<string>();

  const rows: PlannedRow[] = input.rows.map((cells, index) => {
    const issues: RowIssue[] = [];

    const dateText = cellAt(cells, input.mapping.date);
    const day = dateText === "" ? null : parseImportDate(dateText, input.dateOrder);
    if (dateText === "") issues.push("date-missing");
    else if (day === null) issues.push("date-invalid");

    const { cents, invalid } = readAmount(cells, input.mapping, input.signConvention);
    if (invalid) issues.push("amount-invalid");
    else if (cents === null) issues.push("amount-missing");
    // Un importe de cero no es un movimiento: es una fila de ajuste o de saldo
    // que se coló. Se declara en vez de crear un movimiento vacío.
    else if (cents === 0n) issues.push("amount-zero");

    const rawDescription = cellAt(cells, input.mapping.description);
    if (rawDescription === "") issues.push("description-missing");
    const normalized = normalizeDescription(rawDescription);

    let duplicate: DuplicateKind | null = null;
    if (day !== null && cents !== null && cents !== 0n) {
      const key = duplicateKey(day, abs(cents), normalized.merchant);
      if (existingKeys.has(key)) duplicate = "existing";
      else if (seenInFile.has(key)) duplicate = "within-file";
      seenInFile.add(key);
    }

    return {
      sourceRowNumber: index + 1,
      cells,
      day,
      amountCents: cents,
      type: cents === null || cents === 0n ? null : cents < 0n ? "EXPENSE" : "INCOME",
      merchant: normalized.merchant,
      processor: normalized.processor,
      installment: normalized.installment,
      rawDescription,
      issues,
      duplicate,
      usable: issues.length === 0 && duplicate === null,
    };
  });

  const usable = rows.filter((row) => row.usable);
  const days = usable.map((row) => row.day!).sort();

  return {
    rows,
    usableCount: usable.length,
    brokenCount: rows.filter((row) => row.issues.length > 0).length,
    duplicateCount: rows.filter((row) => row.duplicate !== null).length,
    expenseCents: usable
      .filter((row) => row.type === "EXPENSE")
      .reduce((total, row) => total + abs(row.amountCents!), 0n),
    incomeCents: usable
      .filter((row) => row.type === "INCOME")
      .reduce((total, row) => total + row.amountCents!, 0n),
    firstDay: days[0] ?? null,
    lastDay: days[days.length - 1] ?? null,
  };
}

/**
 * Explicación de cada problema, en el idioma de quien lo va a leer.
 *
 * Los mensajes dicen qué pasó con **esa** fila, no una regla general: la persona
 * está mirando una tabla y necesita saber cuál arreglar, no aprender cómo
 * funciona el importador.
 */
export const ROW_ISSUE_MESSAGES: Record<RowIssue, string> = {
  "date-missing": "Sin fecha.",
  "date-invalid": "La fecha no se entiende.",
  "amount-missing": "Sin importe.",
  "amount-invalid": "El importe no se entiende.",
  "amount-zero": "El importe es cero.",
  "description-missing": "Sin descripción.",
};

export const DUPLICATE_MESSAGES: Record<DuplicateKind, string> = {
  existing: "Ya está registrado en Doleth.",
  "within-file": "Repetido dentro del archivo.",
};

/**
 * ¿Conviene invertir la convención de signo?
 *
 * Un archivo de gastos donde casi todo quedó clasificado como ingreso está
 * invertido: nadie tiene un resumen con noventa ingresos y dos gastos. Se avisa
 * en vez de corregirlo solo, porque la excepción existe —un extracto de
 * acreditaciones— y decidir por la persona en su lugar sería adivinar sobre su
 * plata.
 */
export function suggestsInvertedSign(plan: ImportPlan): boolean {
  const classified = plan.rows.filter((row) => row.type !== null);
  if (classified.length < 5) return false;
  const incomes = classified.filter((row) => row.type === "INCOME").length;
  return incomes / classified.length > 0.8;
}
