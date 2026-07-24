/**
 * Lectura y escritura de importes en formato argentino.
 *
 * El dominio persiste centavos como BigInt: acá nunca se usa punto flotante.
 * El campo visible acepta lo que la gente realmente escribe ("$12.500", "12 500",
 * "12.500,50") y el formulario envía al servidor un valor canónico que
 * `parseMoneyToCents` ya sabe leer.
 */

/** Tope de seguridad: ~$999.999.999,99. Evita importes absurdos por tipeo. */
export const MAX_AMOUNT_CENTS = 99_999_999_999n;

export type AmountError = "empty" | "invalid" | "negative" | "zero" | "too-large";

export interface AmountReading {
  cents: bigint | null;
  error: AmountError | null;
}

const ONLY_DIGITS = /^\d+$/;

/**
 * Interpreta un texto escrito por una persona.
 *
 * Convenio argentino: la coma separa decimales y el punto agrupa miles.
 * Cuando solo hay puntos, se decide por la forma: grupos de tres dígitos son
 * miles ("12.500" = 12500), y cualquier otra cosa se lee como decimal
 * ("12.5" = 12,50) para no sorprender a quien viene de un teclado numérico.
 */
export function parseAmountInput(input: string): AmountReading {
  const raw = input.replace(/[\s$ ]/g, "");
  if (raw === "") return { cents: null, error: "empty" };
  if (raw.startsWith("-")) return { cents: null, error: "negative" };

  let whole: string;
  let fraction: string;

  if (raw.includes(",")) {
    const parts = raw.split(",");
    if (parts.length !== 2) return { cents: null, error: "invalid" };
    whole = parts[0]!.replace(/\./g, "");
    fraction = parts[1]!;
  } else if (raw.includes(".")) {
    const groups = raw.split(".");
    const last = groups[groups.length - 1]!;
    const looksLikeThousands = groups.length >= 2 && last.length === 3 && groups.slice(1, -1).every((g) => g.length === 3);
    if (looksLikeThousands) {
      whole = groups.join("");
      fraction = "";
    } else {
      if (groups.length !== 2) return { cents: null, error: "invalid" };
      whole = groups[0]!;
      fraction = last;
    }
  } else {
    whole = raw;
    fraction = "";
  }

  if (whole === "") whole = "0";
  if (!ONLY_DIGITS.test(whole)) return { cents: null, error: "invalid" };
  if (fraction !== "" && !ONLY_DIGITS.test(fraction)) return { cents: null, error: "invalid" };
  if (fraction.length > 2) return { cents: null, error: "invalid" };

  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0") || "0");
  if (cents === 0n) return { cents: 0n, error: "zero" };
  if (cents > MAX_AMOUNT_CENTS) return { cents: null, error: "too-large" };
  return { cents, error: null };
}

/** Valor canónico que entiende `parseMoneyToCents` del dominio. */
export function centsToCanonical(cents: bigint): string {
  const negative = cents < 0n;
  const absolute = negative ? -cents : cents;
  const whole = absolute / 100n;
  const fraction = (absolute % 100n).toString().padStart(2, "0");
  return `${negative ? "-" : ""}${whole}.${fraction}`;
}

/** Formato argentino para lectura: separadores de miles y decimales solo si aportan. */
export function formatCentsAR(cents: bigint): string {
  const negative = cents < 0n;
  const absolute = negative ? -cents : cents;
  const whole = absolute / 100n;
  const remainder = Number(absolute % 100n);
  const groupedWhole = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const body = remainder === 0 ? groupedWhole : `${groupedWhole},${remainder.toString().padStart(2, "0")}`;
  return `${negative ? "-" : ""}${body}`;
}

/** Texto inicial del campo a partir de un importe ya persistido. */
export function centsToInputValue(cents: bigint): string {
  return formatCentsAR(cents);
}

export const amountErrorMessages: Record<AmountError, string> = {
  empty: "Escribí cuánto fue.",
  invalid: "Ese importe no se entiende. Probá con números, por ejemplo 12.500.",
  negative: "El importe tiene que ser positivo.",
  zero: "El importe tiene que ser mayor que cero.",
  "too-large": "Ese importe supera el máximo que Doleth admite.",
};
