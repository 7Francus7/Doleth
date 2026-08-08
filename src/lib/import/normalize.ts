/**
 * Normalización de lo que dice un resumen.
 *
 * Un resumen no habla en castellano: dice `MERPAGO*COTODIG 0345 C.03/12`. Ese
 * texto contiene tres hechos distintos pegados —quién procesó el pago, dónde se
 * compró, y que es la cuota 3 de 12— y mientras sigan pegados no hay reporte
 * posible: "en qué se fue la plata" respondería con doscientas filas únicas que
 * en realidad son cuatro comercios.
 *
 * Separar esos hechos es lo que convierte un import en información. Es también
 * la parte más fácil de hacer mal: cualquier limpieza agresiva termina fusionando
 * dos comercios distintos en uno. Por eso acá nada se descarta —el texto
 * original se conserva siempre— y las reglas son conservadoras: ante la duda, se
 * deja el nombre como vino.
 *
 * Todo el módulo es puro.
 */

// ---------------------------------------------------------------------------
// Importes
// ---------------------------------------------------------------------------

/**
 * Lee un importe de un resumen y devuelve centavos.
 *
 * Tiene que resolver la ambigüedad que ningún archivo declara: `1.234,56` es
 * argentino y `1,234.56` es inglés, y los dos aparecen según de dónde salió el
 * export. La regla es la única que funciona sin saber el origen: **manda el
 * último separador**. En `1.234,56` la coma viene última y separa decimales; en
 * `1,234.56` el punto viene último y hace lo mismo. Cuando hay uno solo, se
 * mira si deja exactamente tres dígitos a la derecha, que es la forma de un
 * grupo de miles.
 *
 * Los paréntesis son negativos: es como los sistemas contables viejos escriben
 * un débito, y hay bancos que todavía exportan así.
 */
export function parseImportAmount(input: string): bigint | null {
  let raw = input.trim();
  if (raw === "") return null;

  let negative = false;

  if (raw.startsWith("(") && raw.endsWith(")")) {
    negative = true;
    raw = raw.slice(1, -1).trim();
  }

  // El código de moneda se saca **antes** que el símbolo, porque lo contiene:
  // quitar el "$" primero convertiría "U$S" en "US" y ya no coincidiría con nada.
  raw = raw.replace(/^(ARS|USD|AR\$|U\$S|US\$)\s*/i, "").replace(/[$\s ]/g, "");

  if (raw.startsWith("-")) {
    negative = !negative;
    raw = raw.slice(1);
  } else if (raw.endsWith("-")) {
    // Signo al final: otra costumbre de los sistemas contables viejos.
    negative = !negative;
    raw = raw.slice(0, -1);
  } else if (raw.startsWith("+")) {
    raw = raw.slice(1);
  }

  if (raw === "") return null;

  const lastComma = raw.lastIndexOf(",");
  const lastDot = raw.lastIndexOf(".");
  let whole: string;
  let fraction: string;

  if (lastComma >= 0 && lastDot >= 0) {
    const decimalAt = Math.max(lastComma, lastDot);
    whole = raw.slice(0, decimalAt).replace(/[.,]/g, "");
    fraction = raw.slice(decimalAt + 1);
  } else if (lastComma >= 0 || lastDot >= 0) {
    const at = Math.max(lastComma, lastDot);
    const right = raw.slice(at + 1);
    const separator = raw[at]!;
    const occurrences = raw.split(separator).length - 1;
    // Tres dígitos a la derecha y más de un separador es agrupamiento de miles
    // sin decimales: 1.234.567. Con uno solo, tres dígitos siguen siendo
    // ambiguos (1.234 puede ser mil doscientos treinta y cuatro), y se resuelve
    // como miles porque es lo que un resumen escribe.
    const isThousands = right.length === 3 && (occurrences > 1 || /^\d{1,3}$/.test(raw.slice(0, at)));
    if (isThousands) {
      whole = raw.replace(/[.,]/g, "");
      fraction = "";
    } else {
      whole = raw.slice(0, at).replace(/[.,]/g, "");
      fraction = right;
    }
  } else {
    whole = raw;
    fraction = "";
  }

  if (whole === "") whole = "0";
  if (!/^\d+$/.test(whole)) return null;
  if (fraction !== "" && !/^\d+$/.test(fraction)) return null;
  // Más de dos decimales no es un importe de dinero: es otra cosa mal mapeada.
  if (fraction.length > 2) return null;

  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0") || "0");
  return negative ? -cents : cents;
}

// ---------------------------------------------------------------------------
// Fechas
// ---------------------------------------------------------------------------

export type DateOrder = "DMY" | "MDY";

/**
 * Decide si las fechas del archivo son día/mes o mes/día.
 *
 * Ningún export lo declara, y adivinar mal corre todos los movimientos de mes
 * sin que nada falle visiblemente. La única evidencia confiable está en los
 * datos: un componente mayor que 12 no puede ser un mes. Si ninguna fila lo
 * tiene —un archivo de los primeros doce días del mes—, se asume el orden
 * argentino, que es de dónde vienen estos archivos.
 */
export function inferDateOrder(samples: readonly string[]): DateOrder {
  for (const sample of samples) {
    const match = sample.trim().match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})$/);
    if (!match) continue;
    const first = Number(match[1]);
    const second = Number(match[2]);
    if (first > 12) return "DMY";
    if (second > 12) return "MDY";
  }
  return "DMY";
}

/**
 * Lee una fecha y devuelve el día civil `YYYY-MM-DD`.
 *
 * Devuelve `null` ante cualquier cosa que no sea una fecha real: un 31 de
 * febrero se rechaza en vez de correrse solo al 3 de marzo, que es lo que haría
 * `new Date` y sería un movimiento fechado en un día en el que no pasó.
 */
export function parseImportDate(input: string, order: DateOrder = "DMY"): string | null {
  const raw = input.trim();
  if (raw === "") return null;

  const iso = raw.match(/^(\d{4})[/.\-](\d{1,2})[/.\-](\d{1,2})/);
  if (iso) return buildDay(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const parts = raw.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})/);
  if (!parts) return null;

  const day = Number(order === "DMY" ? parts[1] : parts[2]);
  const month = Number(order === "DMY" ? parts[2] : parts[1]);
  const yearRaw = Number(parts[3]);
  // Dos dígitos: los resúmenes hablan de este siglo, no de 1926.
  const year = String(parts[3]).length === 2 ? 2000 + yearRaw : yearRaw;

  return buildDay(year, month, day);
}

function buildDay(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (year < 1900 || year > 2200) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  // Si el día no existía, `Date` lo corrió: comparar detecta ese corrimiento.
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Comercios y cuotas
// ---------------------------------------------------------------------------

export interface Installment {
  number: number;
  total: number;
}

export interface NormalizedDescription {
  /** El texto tal como vino. Nunca se pierde: es la evidencia. */
  raw: string;
  /** Nombre legible del comercio. Es lo que agrupan los reportes. */
  merchant: string;
  /** Quién procesó el pago, cuando el resumen lo antepone. */
  processor: string | null;
  /** Cuota detectada, si el texto la declara. */
  installment: Installment | null;
}

/**
 * Procesadores que anteponen su nombre al del comercio.
 *
 * Si no se separan, todos los pagos hechos con Mercado Pago se agrupan como un
 * único "comercio" gigante y el reporte no dice nada. Separado, se puede
 * responder tanto "cuánto gasté en Coto" como "cuánto pasó por Mercado Pago".
 */
const PROCESSORS: { pattern: RegExp; name: string }[] = [
  { pattern: /^MERC(?:ADO)?\s*PAGO\s*[*\-. ]?/i, name: "Mercado Pago" },
  { pattern: /^MERPAGO\s*[*\-. ]?/i, name: "Mercado Pago" },
  { pattern: /^MP\s*[*]/i, name: "Mercado Pago" },
  { pattern: /^PEDIDOSYA\s*[*\-. ]?/i, name: "PedidosYa" },
  { pattern: /^RAPPI\s*[*\-. ]?/i, name: "Rappi" },
  { pattern: /^UBER\s*[*]\s*/i, name: "Uber" },
  { pattern: /^D?LOCAL\s*[*\-. ]?/i, name: "dLocal" },
  { pattern: /^DLO\s*[*\-. ]?/i, name: "dLocal" },
  { pattern: /^PAYU\s*[*\-. ]?/i, name: "PayU" },
  { pattern: /^EBANX\s*[*\-. ]?/i, name: "EBANX" },
  { pattern: /^PAYPAL\s*[*\-. ]?/i, name: "PayPal" },
  { pattern: /^NET\s*[*]\s*/i, name: "Nave" },
  { pattern: /^TN\s*[*]\s*/i, name: "Tiendanube" },
];

/** Ruido que los bancos anteponen y que no aporta nada al nombre del comercio. */
const BANK_PREFIXES = [
  /^COMPRA\s+(?:EN|CON\s+TARJETA(?:\s+DE\s+D[EÉ]BITO)?)\s+/i,
  /^PAGO\s+(?:DE\s+)?SERVICIO\s+/i,
  /^D[EÉ]BITO\s+AUTOM[AÁ]TICO\s+/i,
  /^CONSUMO\s+/i,
  /^TARJ\.?\s*(?:CR[EÉ]D|D[EÉ]B)\.?\s+/i,
];

/**
 * Formas en que un resumen escribe una cuota.
 *
 * `03/12` a secas es deliberadamente ambiguo con una fecha, así que sólo se
 * acepta cuando viene precedido por algo que lo declara cuota. Confundir la
 * fecha con una cuota rompería los dos hechos a la vez.
 */
const INSTALLMENT_PATTERNS = [
  /\bCUOTA\s*(\d{1,2})\s*(?:\/|\s+DE\s+)\s*(\d{1,2})\b/i,
  /\bC\.?\s*(\d{1,2})\s*\/\s*(\d{1,2})\b/i,
  /\b(\d{1,2})\s*\/\s*(\d{1,2})\s*CUOTAS?\b/i,
];

/**
 * Separa el texto del resumen en los hechos que tiene adentro.
 *
 * Conservador por diseño: si después de limpiar no queda nada legible, se
 * devuelve el texto original. Un nombre feo es infinitamente mejor que un
 * comercio vacío, y fusionar dos comercios distintos por limpiar de más es el
 * error que arruina un reporte sin que nadie lo note.
 */
export function normalizeDescription(input: string): NormalizedDescription {
  const raw = input.trim();
  let working = raw;

  let installment: Installment | null = null;
  for (const pattern of INSTALLMENT_PATTERNS) {
    const match = working.match(pattern);
    if (!match) continue;
    const number = Number(match[1]);
    const total = Number(match[2]);
    // Una "cuota 8 de 3" no existe: es otra cosa que se pareció al patrón.
    if (number >= 1 && total >= 1 && number <= total) {
      installment = { number, total };
      working = working.replace(pattern, " ");
      break;
    }
  }

  let processor: string | null = null;
  for (const candidate of PROCESSORS) {
    if (!candidate.pattern.test(working)) continue;
    processor = candidate.name;
    working = working.replace(candidate.pattern, "");
    break;
  }

  for (const prefix of BANK_PREFIXES) working = working.replace(prefix, "");

  working = working
    // Número de sucursal o terminal al final: "SHELL 1234", "COTO 0567".
    .replace(/\s+\d{3,6}$/, "")
    // Restos de puntuación de separación.
    .replace(/[*_]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  const merchant = working === "" ? raw : titleCase(working);
  return { raw, merchant, processor, installment };
}

/**
 * Pasa un nombre en mayúsculas a capitalización de título.
 *
 * Los resúmenes gritan todo en mayúsculas y leer veinte filas así cansa. Las
 * siglas cortas se dejan como están —"YPF" no es "Ypf"— y las preposiciones
 * quedan en minúscula, que es como se escribe un nombre propio en castellano.
 */
const LOWERCASE_WORDS = new Set(["de", "del", "la", "las", "el", "los", "y", "en", "a"]);

/**
 * Siglas que se escriben así y no son palabras.
 *
 * Hace falta una lista porque no hay regla que las distinga: "COTO" y "AFIP"
 * tienen la misma forma —cuatro mayúsculas con vocales— y una es un comercio que
 * se lee "Coto" y la otra una sigla que se lee "AFIP". La regla automática de
 * abajo cubre las que no tienen vocales, como YPF; el resto se declara.
 */
const KNOWN_ACRONYMS = new Set([
  "AFIP", "ARBA", "AYSA", "ANSES", "OSDE", "DGI", "IVA", "IIBB", "ARCA",
  "IOMA", "PAMI", "SUBE", "ATM", "USD", "ARS", "SA", "SRL", "SAS",
]);

/** Una palabra sin vocales y toda en mayúsculas sólo puede ser una sigla. */
const looksLikeAcronym = (word: string): boolean =>
  word.length >= 2 && word.length <= 5 && word === word.toUpperCase() && /^[A-ZÑ]+$/.test(word) && !/[AEIOU]/.test(word);

export function titleCase(input: string): string {
  const originals = input.split(/\s+/).filter(Boolean);
  return originals
    .map((original, index) => {
      const lower = original.toLowerCase();
      // Las preposiciones se resuelven primero: si no, "DE" entraría por la
      // puerta de las siglas y quedaría gritando en medio del nombre.
      if (index > 0 && LOWERCASE_WORDS.has(lower)) return lower;
      if (KNOWN_ACRONYMS.has(original.toUpperCase()) || looksLikeAcronym(original)) {
        return original.toUpperCase();
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}
