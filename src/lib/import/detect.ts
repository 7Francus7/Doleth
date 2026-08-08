/**
 * Qué significa cada columna.
 *
 * Ningún resumen declara su estructura. Este módulo la infiere por dos caminos
 * independientes y los combina: el **encabezado**, cuando el archivo lo trae, y
 * el **contenido**, mirando qué se parece a una fecha y qué a un importe.
 *
 * Que sean dos caminos importa. Un encabezado en inglés, mal escrito o ausente
 * deja la detección por nombre sin nada, y el contenido siempre está. Al revés,
 * un archivo con dos columnas de importes —débito y crédito— es indistinguible
 * por contenido y el encabezado lo resuelve de una.
 *
 * Nada de lo que sale de acá se aplica solo: la propuesta va a la pantalla de
 * previsualización para que la persona la confirme o la corrija. Una detección
 * automática que escribe sin preguntar convierte un error de lectura en un
 * movimiento falso que después hay que encontrar a mano.
 */

import { parseImportAmount, parseImportDate } from "./normalize";

export type ColumnRole =
  | "date"
  /** Fecha en que el consumo se imputa al resumen, distinta de la de compra. */
  | "postedDate"
  | "description"
  /** Importe con signo: negativo gasto, positivo ingreso. */
  | "amount"
  /** Columna de salidas, siempre positiva. Convive con `credit`. */
  | "debit"
  /** Columna de entradas, siempre positiva. */
  | "credit"
  | "balance"
  | "currency"
  | "installment"
  /** Columna que no se usa. */
  | "ignore";

export interface ColumnGuess {
  index: number;
  header: string;
  role: ColumnRole;
  /** Qué tan segura es la propuesta. Se muestra: la persona decide con eso. */
  confidence: "high" | "medium" | "low";
}

/**
 * Nombres de columna conocidos.
 *
 * La lista es larga a propósito y mezcla castellano e inglés, con y sin tildes,
 * porque cada banco escribe lo mismo distinto y acertar el encabezado ahorra a
 * la persona el trabajo de mapear a mano.
 */
const HEADER_PATTERNS: { role: ColumnRole; patterns: RegExp[] }[] = [
  {
    role: "postedDate",
    patterns: [/fecha\s*(de\s*)?(imputaci|proces|contab)/i, /posted/i, /fecha\s*valor/i],
  },
  {
    role: "date",
    patterns: [/^fecha/i, /fecha\s*(de\s*)?(oper|compra|mov)/i, /^f\.?\s*oper/i, /^date$/i, /transaction\s*date/i, /^d[ií]a$/i],
  },
  {
    role: "description",
    patterns: [/descrip/i, /detalle/i, /concepto/i, /comercio/i, /referencia/i, /movimiento/i, /^description$/i, /^memo$/i, /^payee$/i, /leyenda/i],
  },
  { role: "debit", patterns: [/d[eé]bito/i, /^debe$/i, /cargo/i, /egreso/i, /^debit$/i, /extracci/i] },
  { role: "credit", patterns: [/cr[eé]dito/i, /^haber$/i, /abono/i, /ingreso/i, /^credit$/i, /dep[oó]sito/i] },
  { role: "balance", patterns: [/^saldo/i, /^balance$/i] },
  { role: "installment", patterns: [/cuota/i, /installment/i] },
  { role: "currency", patterns: [/moneda/i, /^currency$/i, /divisa/i] },
  { role: "amount", patterns: [/importe/i, /^monto/i, /^amount$/i, /^valor$/i, /^total$/i] },
];

/** ¿La primera fila son nombres de columna y no datos? */
export function looksLikeHeader(row: readonly string[]): boolean {
  const filled = row.filter((cell) => cell !== "");
  if (filled.length < 2) return false;
  // Un encabezado no tiene fechas ni importes adentro: son etiquetas.
  const dataLike = filled.filter(
    (cell) => parseImportDate(cell) !== null || parseImportAmount(cell) !== null,
  ).length;
  return dataLike === 0;
}

const matchHeader = (header: string): ColumnRole | null => {
  for (const { role, patterns } of HEADER_PATTERNS) {
    if (patterns.some((pattern) => pattern.test(header))) return role;
  }
  return null;
};

/** Proporción de celdas no vacías de una columna que cumplen un predicado. */
function ratio(values: readonly string[], predicate: (value: string) => boolean): number {
  const filled = values.filter((value) => value.trim() !== "");
  if (filled.length === 0) return 0;
  return filled.filter(predicate).length / filled.length;
}

/**
 * Propone un rol para cada columna.
 *
 * El encabezado manda cuando dice algo reconocible, porque es una declaración
 * explícita del banco. El contenido cubre el resto y también corrige: una
 * columna llamada "Importe" que no contiene importes no es la de importes, y
 * decirlo con confianza baja es más honesto que insistir con el nombre.
 */
export function detectColumns(rows: readonly string[][]): {
  hasHeader: boolean;
  columns: ColumnGuess[];
} {
  if (rows.length === 0) return { hasHeader: false, columns: [] };

  const hasHeader = looksLikeHeader(rows[0]!);
  const headerRow = hasHeader ? rows[0]! : [];
  const body = hasHeader ? rows.slice(1) : [...rows];
  const width = Math.max(...rows.map((row) => row.length));

  const columns: ColumnGuess[] = [];
  const taken = new Set<ColumnRole>();

  for (let index = 0; index < width; index += 1) {
    const header = headerRow[index]?.trim() ?? "";
    const values = body.map((row) => row[index] ?? "");

    const dateRatio = ratio(values, (value) => parseImportDate(value) !== null);
    const amountRatio = ratio(values, (value) => parseImportAmount(value) !== null);
    const textRatio = ratio(values, (value) => parseImportDate(value) === null && parseImportAmount(value) === null);

    const byHeader = header ? matchHeader(header) : null;
    let role: ColumnRole = "ignore";
    let confidence: ColumnGuess["confidence"] = "low";

    if (byHeader) {
      role = byHeader;
      // El nombre coincide y el contenido lo respalda: no hay nada que dudar.
      const contentAgrees =
        (byHeader === "date" || byHeader === "postedDate") ? dateRatio > 0.6
          : (byHeader === "amount" || byHeader === "debit" || byHeader === "credit" || byHeader === "balance") ? amountRatio > 0.5
            : true;
      confidence = contentAgrees ? "high" : "low";
    } else if (dateRatio > 0.7) {
      // Dos columnas de fecha: la segunda suele ser la de imputación.
      role = taken.has("date") ? "postedDate" : "date";
      confidence = "high";
    } else if (amountRatio > 0.7) {
      role = "amount";
      confidence = "medium";
    } else if (textRatio > 0.6 && values.some((value) => value.trim().length > 3)) {
      role = "description";
      confidence = "medium";
    }

    if (role !== "ignore") taken.add(role);
    columns.push({ index, header, role, confidence });
  }

  return { hasHeader, columns: resolveConflicts(columns) };
}

/**
 * Deja un solo dueño por rol.
 *
 * Dos columnas marcadas "importe" romperían el mapeo sin avisar: la segunda
 * pisaría a la primera en silencio. Gana la de mayor confianza y, a igualdad, la
 * primera —que es donde los resúmenes ponen la columna principal—. La perdedora
 * queda en `ignore` y visible en la pantalla, para que se pueda reasignar a mano
 * si la elección fue la equivocada.
 *
 * `debit` y `credit` quedan fuera de esta regla: existir de a pares es
 * justamente su forma normal.
 */
function resolveConflicts(columns: readonly ColumnGuess[]): ColumnGuess[] {
  const rank = { high: 3, medium: 2, low: 1 } as const;
  const exclusive: ColumnRole[] = ["date", "postedDate", "description", "amount", "balance", "currency", "installment"];
  const result = columns.map((column) => ({ ...column }));

  for (const role of exclusive) {
    const holders = result.filter((column) => column.role === role);
    if (holders.length <= 1) continue;
    const winner = holders.reduce((best, candidate) =>
      rank[candidate.confidence] > rank[best.confidence] ? candidate : best,
    );
    for (const holder of holders) {
      if (holder !== winner) holder.role = "ignore";
    }
  }

  return result;
}

/** El mapeo con el que se lee el archivo: rol por índice de columna. */
export type ColumnMapping = Partial<Record<Exclude<ColumnRole, "ignore">, number>>;

export const toMapping = (columns: readonly ColumnGuess[]): ColumnMapping => {
  const mapping: ColumnMapping = {};
  for (const column of columns) {
    if (column.role === "ignore") continue;
    if (mapping[column.role] === undefined) mapping[column.role] = column.index;
  }
  return mapping;
};

/**
 * ¿Alcanza este mapeo para leer el archivo?
 *
 * Hacen falta tres cosas: cuándo, cuánto y qué. Sin fecha no se puede ubicar el
 * movimiento en el tiempo; sin importe no hay movimiento; sin descripción hay
 * movimiento pero no hay forma de reconocerlo después ni de categorizarlo, así
 * que también se exige. Los errores se devuelven todos juntos: pedirlos de a uno
 * obliga a adivinar cuántos faltan.
 */
export function validateMapping(mapping: ColumnMapping): string[] {
  const problems: string[] = [];
  if (mapping.date === undefined) problems.push("Falta indicar cuál es la columna de la fecha.");
  if (mapping.amount === undefined && mapping.debit === undefined && mapping.credit === undefined) {
    problems.push("Falta indicar cuál es la columna del importe, o el par de débito y crédito.");
  }
  if (mapping.description === undefined) {
    problems.push("Falta indicar cuál es la columna de la descripción.");
  }
  return problems;
}
