/**
 * Lectura de texto delimitado.
 *
 * Un resumen bancario argentino casi nunca es un CSV limpio. Llega en
 * Windows-1252 porque salió de un sistema viejo, separado por punto y coma
 * porque la coma ya se usa para los decimales, con dos o tres líneas de
 * encabezado institucional antes de la tabla, y con importes entre paréntesis
 * cuando son negativos.
 *
 * Este módulo resuelve sólo la primera capa: convertir bytes en una grilla de
 * celdas. No interpreta qué significa cada columna —eso es `detect.ts`— ni
 * normaliza importes —eso es `normalize.ts`—. Separarlo importa porque cada capa
 * falla distinto: un archivo puede leerse perfecto y tener las columnas
 * cambiadas, y decirle a la persona "no pude leer el archivo" cuando en realidad
 * no supe qué columna era la fecha la deja sin nada que hacer.
 *
 * Es puro y sin dependencias: recibe bytes, devuelve celdas.
 */

/** Separadores que se prueban, en orden de probabilidad para exports en español. */
export const CANDIDATE_DELIMITERS = [";", ",", "\t", "|"] as const;

export type Delimiter = (typeof CANDIDATE_DELIMITERS)[number];

export interface ParsedGrid {
  rows: string[][];
  delimiter: Delimiter;
  /** Codificación con la que se decodificaron los bytes. */
  encoding: "utf-8" | "windows-1252";
}

/**
 * Decodifica los bytes probando UTF-8 y cayendo a Windows-1252.
 *
 * El orden no es arbitrario: UTF-8 estricto falla ante bytes que no forman una
 * secuencia válida, y eso es exactamente la señal de que el archivo viene de un
 * sistema que exporta en la codificación de Windows. Al revés no funcionaría:
 * Windows-1252 acepta cualquier byte, así que nunca fallaría y leería un archivo
 * UTF-8 con las tildes rotas sin avisar.
 */
export function decodeBytes(bytes: Uint8Array): { text: string; encoding: "utf-8" | "windows-1252" } {
  // El BOM se saca antes de decodificar: si sobrevive, se cuela como carácter
  // invisible en el nombre de la primera columna y ninguna detección lo encuentra.
  const withoutBom =
    bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? bytes.subarray(3) : bytes;

  try {
    return { text: new TextDecoder("utf-8", { fatal: true }).decode(withoutBom), encoding: "utf-8" };
  } catch {
    return { text: new TextDecoder("windows-1252").decode(withoutBom), encoding: "windows-1252" };
  }
}

/**
 * Elige el separador contando cuál produce filas más consistentes.
 *
 * No alcanza con contar apariciones: una descripción como "Compra en Coto,
 * sucursal Centro" tiene comas y no las tiene el resto del archivo. Lo que
 * distingue al separador verdadero es que produce **la misma cantidad de
 * columnas en casi todas las filas**, así que se mide eso.
 */
export function detectDelimiter(text: string): Delimiter {
  const sample = text.split(/\r?\n/).filter((line) => line.trim() !== "").slice(0, 20);
  if (sample.length === 0) return ",";

  let best: { delimiter: Delimiter; score: number } = { delimiter: ",", score: -1 };

  for (const delimiter of CANDIDATE_DELIMITERS) {
    const counts = sample.map((line) => splitLine(line, delimiter).length);
    const columns = mostCommon(counts);
    // Una sola columna significa que ese separador no aparece: no separa nada.
    if (columns < 2) continue;
    const consistent = counts.filter((count) => count === columns).length;
    // El puntaje premia consistencia primero y cantidad de columnas después: dos
    // separadores igualmente consistentes se desempatan por el que estructura más.
    const score = consistent * 1000 + columns;
    if (score > best.score) best = { delimiter, score };
  }

  return best.delimiter;
}

const mostCommon = (values: number[]): number => {
  const tally = new Map<number, number>();
  for (const value of values) tally.set(value, (tally.get(value) ?? 0) + 1);
  let winner = 0;
  let top = 0;
  for (const [value, count] of tally) {
    if (count > top || (count === top && value > winner)) {
      winner = value;
      top = count;
    }
  }
  return winner;
};

/**
 * Parte una línea respetando comillas al estilo RFC 4180.
 *
 * Una comilla doble dentro de un campo entrecomillado se escribe duplicada. Se
 * respeta porque las descripciones bancarias traen comillas y comas reales, y
 * partir por separador a secas correría todas las columnas siguientes.
 */
function splitLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]!;

    if (quoted) {
      if (char === '"') {
        if (line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"' && current.trim() === "") {
      quoted = true;
      current = "";
      continue;
    }
    if (char === delimiter) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

/**
 * Convierte el texto en una grilla.
 *
 * Un campo entrecomillado puede contener saltos de línea —una descripción larga
 * partida en dos—, así que no se puede partir por `\n` y listo: hay que llevar
 * la cuenta de si se está adentro de comillas.
 */
export function parseDelimited(text: string, delimiter: Delimiter): string[][] {
  const rows: string[][] = [];
  let line = "";
  let quoted = false;

  const flush = () => {
    if (line.trim() !== "") rows.push(splitLine(line, delimiter));
    line = "";
  };

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]!;
    if (char === '"') quoted = !quoted;
    if (!quoted && (char === "\n" || char === "\r")) {
      // \r\n cuenta como un solo corte.
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      flush();
      continue;
    }
    line += char;
  }
  flush();

  return rows;
}

/** Lee un archivo entero: decodifica, detecta separador y arma la grilla. */
export function parseCsv(bytes: Uint8Array): ParsedGrid {
  const { text, encoding } = decodeBytes(bytes);
  const delimiter = detectDelimiter(text);
  return { rows: parseDelimited(text, delimiter), delimiter, encoding };
}

/**
 * Recorta las filas que no forman parte de la tabla.
 *
 * Los exports bancarios suelen abrir con el nombre del banco, el número de
 * cuenta y el período, cada uno en su propia fila de una sola celda. La tabla
 * verdadera empieza donde aparece la primera fila con varias celdas llenas, y
 * desde ahí el ancho se mantiene. Se recorta también al final, donde suelen
 * aparecer totales y leyendas legales.
 */
export function trimToTable(rows: readonly string[][]): { rows: string[][]; skippedLeading: number } {
  const filled = (row: readonly string[]) => row.filter((cell) => cell !== "").length;
  const width = mostCommon(rows.map(filled).filter((count) => count > 1));
  if (width < 2) return { rows: rows.map((row) => [...row]), skippedLeading: 0 };

  const start = rows.findIndex((row) => filled(row) >= width);
  if (start < 0) return { rows: rows.map((row) => [...row]), skippedLeading: 0 };

  const body: string[][] = [];
  for (const row of rows.slice(start)) {
    // Una fila con muchas menos celdas llenas que la tabla, después de haber
    // empezado, es un pie: total, leyenda o corte de página. Se detiene ahí en
    // vez de intentar leerla como movimiento.
    if (filled(row) < Math.max(2, width - 1)) break;
    body.push([...row]);
  }

  return { rows: body, skippedLeading: start };
}
