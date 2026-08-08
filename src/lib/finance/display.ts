import "server-only";
import {
  CURRENCY_LABELS,
  CURRENCY_SYMBOLS,
  FX_VARIANT_LABELS,
  SUPPORTED_CURRENCIES,
  formatRate,
  money,
  type Currency,
  type FxVariant,
} from "./currency";
import { resolveRateBook, type ResolvedRateBook } from "./rates/store";
import { rateAgeDays, valuate, valuateOne, type UnconvertedAmount } from "./valuation";
import { formatCentsAR } from "./amount";

/**
 * El borde entre un ledger multimoneda y una pantalla que muestra un número.
 *
 * Doleth guarda cada importe en la moneda en la que ocurrió, pero una pantalla
 * tiene que decir **un** patrimonio. Convertir en el medio de cada cálculo
 * ensuciaría todo el núcleo puro con cotizaciones; convertir al final, después
 * de haber sumado, sería directamente incorrecto.
 *
 * La solución es convertir **una sola vez y acá**: se valúa cada saldo a la
 * moneda de lectura antes de entregárselo a la capa de cálculo, que sigue
 * trabajando en una sola moneda y no se entera de nada. Todo lo que no se pudo
 * convertir viaja en `missing` y la pantalla tiene la obligación de decirlo.
 *
 * Esa obligación es el punto entero del archivo. Un saldo que no se puede
 * convertir entra al cálculo como cero —no hay otra forma de que la aritmética
 * cierre— y eso es aceptable únicamente mientras el número nunca se presente
 * como completo. Por eso `complete` no es informativo: es la condición que
 * habilita a mostrar el total sin una advertencia al lado.
 */

/** Todo lo que una pantalla necesita saber para presentar un importe convertido. */
export interface DisplayContext {
  /** Moneda en la que la persona pidió leer. */
  currency: Currency;
  /** Símbolo con el que se antepone cada importe. */
  symbol: string;
  /** Tipo de cambio en uso. */
  variant: FxVariant;
  /** Cotización usada, lista para mostrar. `null` cuando no hizo falta o no hay. */
  rateLabel: string | null;
  rateAsOf: Date | null;
  rateProvider: string | null;
  /** `true` cuando la cotización ya no puede presentarse como vigente. */
  stale: boolean;
  /** Antigüedad de la cotización en días completos. */
  rateAgeDays: number | null;
  /** Lo que no se pudo convertir por falta de cotización. */
  missing: UnconvertedAmount[];
  /**
   * Lo que quedó afuera por estar en una moneda que el producto no sabe leer.
   * Debería estar siempre vacío —la escritura la rechaza— y se expone
   * justamente para que, si alguna vez no lo está, se note.
   */
  unreadable: { currency: string; cents: bigint }[];
  /** `true` sólo si todo lo entregado se pudo expresar en `currency`. */
  complete: boolean;
}

export interface CurrencyAmount {
  balanceCents: bigint;
  currency: string;
}

/**
 * Valúa una lista de saldos a la moneda de lectura.
 *
 * Devuelve los importes convertidos **en el mismo orden** que entraron, para que
 * quien llama pueda reemplazarlos uno a uno sin volver a cruzar listas. Un saldo
 * sin cotización vuelve como `0n` y queda anotado en el contexto: es la única
 * forma de que el resto de la aritmética cierre, y por eso el contexto obliga a
 * declararlo.
 */
export function valueAmounts(
  amounts: readonly CurrencyAmount[],
  book: ResolvedRateBook,
  now = new Date(),
): { valued: bigint[]; context: DisplayContext } {
  const display = book.displayCurrency;
  const readable = amounts.map((amount) =>
    isReadable(amount.currency) ? money(amount.balanceCents, amount.currency) : null,
  );

  // Un importe sin cotización entra al cálculo como cero. Es la única forma de
  // que la aritmética de la capa pura cierre, y sólo es aceptable porque el
  // contexto que sale de acá obliga a declararlo antes de mostrar el total.
  const valued = readable.map((amount) => {
    if (!amount) return 0n;
    return valuateOne(amount, display, book)?.cents ?? 0n;
  });

  // `missing` sale de una sola definición —la del módulo de valuación— y no de
  // un segundo recorrido que podría divergir del primero.
  const convertible = readable.filter((amount): amount is NonNullable<typeof amount> => amount !== null);
  const { missing } = valuate(convertible, display, book);

  // Una moneda que el producto no sabe leer no se puede convertir ni nombrar,
  // pero tampoco puede desaparecer del total en silencio. No debería existir
  // —las acciones y la base la rechazan al escribir— y justamente por eso, si
  // aparece, hay que decirlo en vez de confiar en que no va a pasar.
  const unreadable = amounts
    .filter((amount, index) => readable[index] === null && amount.balanceCents !== 0n)
    .map((amount) => ({ currency: amount.currency, cents: amount.balanceCents }));

  return { valued, context: buildContext(book, missing, unreadable, now) };
}

const isReadable = (currency: string): currency is Currency =>
  (SUPPORTED_CURRENCIES as readonly string[]).includes(currency);

function buildContext(
  book: ResolvedRateBook,
  missing: UnconvertedAmount[],
  unreadable: { currency: string; cents: bigint }[],
  now: Date,
): DisplayContext {
  const active = book.active;
  return {
    currency: book.displayCurrency,
    symbol: CURRENCY_SYMBOLS[book.displayCurrency],
    variant: book.variant,
    rateLabel: active ? formatRate(active.rateMicros) : null,
    rateAsOf: active?.asOf ?? null,
    rateProvider: active?.provider ?? null,
    stale: book.stale,
    rateAgeDays: active ? rateAgeDays(active.asOf, now) : null,
    missing,
    unreadable,
    complete: missing.length === 0 && unreadable.length === 0,
  };
}

/**
 * Contexto de lectura de una persona, sin importes que valuar.
 *
 * Lo usan las pantallas que sólo necesitan saber en qué moneda hablar.
 */
export async function getDisplayContext(userId: string, now = new Date()): Promise<DisplayContext> {
  return buildContext(await resolveRateBook(userId, now), [], [], now);
}

/**
 * Contexto de lectura a partir de un libro ya resuelto.
 *
 * Lo usan las lecturas que ya pidieron el libro para otra cosa: volver a
 * resolverlo consultaría la base de nuevo y, peor, podría devolver una
 * cotización distinta de la que produjo los números que se están por mostrar.
 */
export function getDisplayContextFromBook(book: ResolvedRateBook, now = new Date()): DisplayContext {
  return buildContext(book, [], [], now);
}

/**
 * Frase que declara con qué cotización se leyó un número.
 *
 * Existe para que ninguna pantalla tenga que inventar su propia redacción: la
 * lectura al blue de ayer se cuenta igual en /ahora que en /mi-realidad, porque
 * dos textos distintos para el mismo hecho hacen dudar de los dos.
 */
export function describeRate(context: DisplayContext): string | null {
  if (!context.rateLabel) return null;
  const variant = FX_VARIANT_LABELS[context.variant];
  const base = `1 dólar = $${context.rateLabel} (${variant.toLowerCase()})`;
  if (context.rateAgeDays === null || context.rateAgeDays === 0) return `${base}, de hoy.`;
  if (context.rateAgeDays === 1) return `${base}, de ayer.`;
  return `${base}, de hace ${context.rateAgeDays} días.`;
}

/**
 * Frase que declara lo que quedó sin convertir.
 *
 * Nunca dice "aproximadamente" ni suaviza: dice exactamente cuánto y en qué
 * moneda quedó afuera, porque una persona que tiene dólares sin cotizar
 * necesita saber que el total que está mirando no los incluye.
 */
export function describeMissing(context: DisplayContext): string | null {
  if (context.complete) return null;
  const parts = [
    ...context.missing.map(
      (gap) => `${CURRENCY_SYMBOLS[gap.currency]} ${formatCentsAR(gap.cents)} en ${CURRENCY_LABELS[gap.currency]}`,
    ),
    ...context.unreadable.map((gap) => `${formatCentsAR(gap.cents)} en ${gap.currency}`),
  ];
  const list = parts.length === 1 ? parts[0]! : `${parts.slice(0, -1).join(", ")} y ${parts[parts.length - 1]!}`;
  return `Este total no incluye ${list}: falta la cotización para convertirlos.`;
}

/**
 * El mismo importe expresado en la otra moneda, como lectura secundaria.
 *
 * Es lo que hace que "en pesos y en dólares" sea una sola pantalla y no dos
 * modos excluyentes: el número dominante manda, y al lado se lee su equivalente
 * sin tener que cambiar nada de lugar. Devuelve `null` cuando no hay cotización,
 * porque una equivalencia inventada es peor que ninguna.
 */
export function describeEquivalent(cents: bigint, context: DisplayContext, book: ResolvedRateBook): string | null {
  const other = SUPPORTED_CURRENCIES.find((currency) => currency !== context.currency);
  if (!other) return null;
  const converted = valuateOne(money(cents, context.currency), other, book);
  if (!converted) return null;
  const sign = converted.cents < 0n ? "-" : "";
  const absolute = converted.cents < 0n ? -converted.cents : converted.cents;
  return `${sign}${CURRENCY_SYMBOLS[other]} ${formatCentsAR(absolute)}`;
}

export { resolveRateBook };
export type { ResolvedRateBook };
