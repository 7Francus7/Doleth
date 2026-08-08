/**
 * Moneda y conversión.
 *
 * Doleth guarda importes como centavos enteros (`BigInt`) y nunca usa punto
 * flotante. Este módulo agrega la segunda mitad de esa disciplina: un importe no
 * significa nada sin su moneda, y convertirlo no es multiplicar por un número
 * suelto.
 *
 * Tres reglas sostienen todo lo que sigue.
 *
 * 1. **La cotización tiene dirección.** Se guarda siempre como "cuántas unidades
 *    de `quote` vale 1 unidad de `base`", con `base` = la moneda fuerte. En
 *    Argentina eso coincide con cómo se habla: "el dólar está a 1.400" es
 *    `USD → ARS = 1400`. Convertir en el sentido contrario divide por esa misma
 *    cotización en vez de invertirla primero: invertir y después multiplicar
 *    redondea dos veces y el ida y vuelta deja de cerrar.
 *
 * 2. **La escala es fija y entera.** `rateMicros` son millonésimas. 1.400,50
 *    pesos por dólar es `1_400_500_000n`. Alcanza para cotizaciones de cripto
 *    con seis decimales y no pierde nada en el camino.
 *
 * 3. **Una conversión imposible no vale cero.** Cuando falta la cotización, las
 *    funciones de este módulo devuelven `null` y quien las llama tiene que
 *    decidir qué mostrar. Nunca convierten "lo que se puede" y completan el
 *    resto con cero: un patrimonio incompleto que se presenta como total es
 *    peor que no mostrarlo.
 */

/** Escala entera de las cotizaciones: millonésimas. */
export const RATE_SCALE = 1_000_000n;

/**
 * Monedas que el producto sabe leer y escribir.
 *
 * La lista es corta a propósito. Agregar una moneda no es agregar un string: hay
 * que poder cotizarla, formatearla y explicarla.
 */
export const SUPPORTED_CURRENCIES = ["ARS", "USD"] as const;

export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export function isSupportedCurrency(value: string): value is Currency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}

/**
 * Tipo de dólar. En Argentina "el dólar" no es un número: es varios, y la
 * diferencia entre ellos cambia el patrimonio de una persona de forma material.
 * Elegir cuál se usa es una decisión del usuario, no un detalle de
 * implementación, así que viaja explícita en cada cotización.
 */
export const FX_VARIANTS = ["OFICIAL", "BLUE", "MEP", "CCL", "CRIPTO", "TARJETA", "MANUAL"] as const;

export type FxVariant = (typeof FX_VARIANTS)[number];

export function isFxVariant(value: string): value is FxVariant {
  return (FX_VARIANTS as readonly string[]).includes(value);
}

/** Nombre legible de cada tipo de cambio, para la interfaz. */
export const FX_VARIANT_LABELS: Record<FxVariant, string> = {
  OFICIAL: "Oficial",
  BLUE: "Blue",
  MEP: "MEP",
  CCL: "Contado con liquidación",
  CRIPTO: "Cripto",
  TARJETA: "Tarjeta",
  MANUAL: "Tuya",
};

/** Un importe siempre viaja con su moneda: un número solo no es plata. */
export interface Money {
  cents: bigint;
  currency: Currency;
}

export const money = (cents: bigint, currency: Currency): Money => ({ cents, currency });

/**
 * Una cotización vigente.
 *
 * `asOf` es el momento que declara el origen, no el momento en que Doleth la
 * leyó: una cotización de ayer sigue siendo de ayer aunque se descargue hoy.
 */
export interface ExchangeRate {
  base: Currency;
  quote: Currency;
  /** Unidades de `quote` por 1 unidad de `base`, en millonésimas. */
  rateMicros: bigint;
  variant: FxVariant;
  asOf: Date;
  /** Quién la dijo: el nombre del proveedor, o `null` si la cargó el usuario. */
  provider: string | null;
}

/**
 * División entera con redondeo al más cercano, y el medio hacia afuera del cero.
 *
 * Se elige "medio hacia afuera" y no bancario porque es la regla que la gente
 * espera al ver un importe: 0,005 se muestra como 0,01. Lo importante no es cuál
 * de las dos, sino que sea una sola en todo el producto y que esté escrita.
 */
export function divideRounded(numerator: bigint, denominator: bigint): bigint {
  if (denominator === 0n) throw new Error("División por cero en una conversión de moneda.");
  const negative = numerator < 0n !== denominator < 0n;
  const absoluteNumerator = numerator < 0n ? -numerator : numerator;
  const absoluteDenominator = denominator < 0n ? -denominator : denominator;
  const quotient = absoluteNumerator / absoluteDenominator;
  const remainder = absoluteNumerator % absoluteDenominator;
  const rounded = remainder * 2n >= absoluteDenominator ? quotient + 1n : quotient;
  return negative ? -rounded : rounded;
}

/**
 * ¿Esta cotización sirve para ir de `from` a `to`?
 *
 * Sirve en los dos sentidos: una cotización USD→ARS convierte pesos a dólares
 * dividiendo. Lo que no hace es encadenar dos cotizaciones para llegar a una
 * tercera moneda; eso sería inventar un cruce que nadie publicó.
 */
export function rateApplies(rate: ExchangeRate, from: Currency, to: Currency): boolean {
  if (from === to) return true;
  return (rate.base === from && rate.quote === to) || (rate.base === to && rate.quote === from);
}

/**
 * Convierte un importe entre dos monedas con una cotización concreta.
 *
 * Devuelve `null` cuando la cotización no cubre ese par: es la señal de que
 * falta un dato, y obliga a quien llama a decirlo en pantalla.
 */
export function convert(amount: Money, to: Currency, rate: ExchangeRate): Money | null {
  if (amount.currency === to) return amount;
  if (!rateApplies(rate, amount.currency, to)) return null;
  if (rate.rateMicros <= 0n) return null;

  // De la moneda fuerte a la débil se multiplica; en el otro sentido se divide
  // por la misma cotización. Nunca se invierte primero: eso redondearía dos
  // veces y el ida y vuelta dejaría de cerrar.
  const cents =
    rate.base === amount.currency
      ? divideRounded(amount.cents * rate.rateMicros, RATE_SCALE)
      : divideRounded(amount.cents * RATE_SCALE, rate.rateMicros);

  return { cents, currency: to };
}

/**
 * Lectura humana de una cotización: "1.400,50".
 *
 * Recorta los decimales que no aportan —una cotización de 1.400 exactos no se
 * muestra como 1.400,000000— pero nunca redondea a menos de dos.
 */
export function formatRate(rateMicros: bigint): string {
  const negative = rateMicros < 0n;
  const absolute = negative ? -rateMicros : rateMicros;
  const whole = absolute / RATE_SCALE;
  const fraction = (absolute % RATE_SCALE).toString().padStart(6, "0").replace(/0+$/, "");
  const shown = fraction.length < 2 ? fraction.padEnd(2, "0") : fraction;
  const groupedWhole = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${negative ? "-" : ""}${groupedWhole},${shown}`;
}

/**
 * Lee una cotización escrita por una persona ("1.400,50", "1400.5", "1400").
 *
 * Usa el mismo convenio argentino que el resto de los importes: la coma separa
 * decimales y el punto agrupa miles. Un punto solo con menos de tres dígitos
 * detrás se lee como decimal, porque es lo que sale de un teclado numérico.
 */
export function parseRateInput(input: string): bigint | null {
  const raw = input.replace(/[\s$]/g, "");
  if (raw === "") return null;

  let whole: string;
  let fraction: string;

  if (raw.includes(",")) {
    const parts = raw.split(",");
    if (parts.length !== 2) return null;
    whole = parts[0]!.replace(/\./g, "");
    fraction = parts[1]!;
  } else if (raw.includes(".")) {
    const groups = raw.split(".");
    const last = groups[groups.length - 1]!;
    const looksLikeThousands =
      groups.length >= 2 && last.length === 3 && groups.slice(1, -1).every((group) => group.length === 3);
    if (looksLikeThousands) {
      whole = groups.join("");
      fraction = "";
    } else {
      if (groups.length !== 2) return null;
      whole = groups[0]!;
      fraction = last;
    }
  } else {
    whole = raw;
    fraction = "";
  }

  if (whole === "") whole = "0";
  if (!/^\d+$/.test(whole)) return null;
  if (fraction !== "" && !/^\d+$/.test(fraction)) return null;
  if (fraction.length > 6) return null;

  const micros = BigInt(whole) * RATE_SCALE + BigInt(fraction.padEnd(6, "0") || "0");
  if (micros <= 0n) return null;
  return micros;
}

/** Símbolo de cada moneda, para acompañar un importe sin escribir su nombre. */
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  ARS: "$",
  USD: "US$",
};

/** Nombre de cada moneda cuando hace falta decirlo con palabras. */
export const CURRENCY_LABELS: Record<Currency, string> = {
  ARS: "pesos",
  USD: "dólares",
};
