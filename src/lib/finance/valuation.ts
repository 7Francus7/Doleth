/**
 * Valuación multimoneda.
 *
 * Sumar plata en monedas distintas no es sumar números. Este módulo hace esa
 * suma y, sobre todo, declara qué parte no pudo hacer.
 *
 * La regla que ordena todo el archivo: **un total incompleto nunca se presenta
 * como total**. Si falta la cotización de una moneda, ese dinero no se convierte
 * a cero ni se descarta en silencio: viaja en `missing`, y la pantalla tiene la
 * obligación de decirlo. El manifiesto de diseño lo pide con todas las letras —
 * "la confianza del dato es visible, nunca implícita"— y acá es donde eso se
 * vuelve código en vez de intención.
 *
 * El módulo es puro: no lee la base ni la red. Recibe cotizaciones ya resueltas
 * y devuelve números. Eso lo hace probable sin infraestructura y reutilizable
 * desde cualquier pantalla.
 */

import { convert, rateApplies, type Currency, type ExchangeRate, type Money } from "./currency";

/**
 * El conjunto de cotizaciones vigentes para una persona, ya resuelto.
 *
 * Resolver quiere decir que las preferencias del usuario —qué dólar usa, si
 * cargó una cotización propia— ya se aplicaron antes de llegar acá. Este módulo
 * no elige entre blue y oficial: recibe la elegida.
 */
export interface RateBook {
  rates: readonly ExchangeRate[];
}

export const emptyRateBook: RateBook = { rates: [] };

/** La primera cotización que cubre el par, o `null` si ninguna lo cubre. */
export function findRate(book: RateBook, from: Currency, to: Currency): ExchangeRate | null {
  if (from === to) return null;
  return book.rates.find((rate) => rateApplies(rate, from, to)) ?? null;
}

/** Lo que no se pudo convertir, agrupado por la moneda en la que quedó. */
export interface UnconvertedAmount {
  currency: Currency;
  cents: bigint;
}

export interface Valuation {
  /** Moneda en la que se expresa `totalCents`. */
  currency: Currency;
  /** Suma de todo lo que **sí** se pudo convertir. Nunca incluye lo que falta. */
  totalCents: bigint;
  /** Lo que quedó afuera, con su moneda original. Vacío cuando no falta nada. */
  missing: UnconvertedAmount[];
  /** `true` sólo cuando `totalCents` representa la totalidad de lo entregado. */
  complete: boolean;
  /**
   * La cotización más vieja de las que se usaron. Sirve para que la pantalla
   * pueda decir "al dólar de ayer" en vez de sugerir que el número es de ahora.
   * `null` cuando no hizo falta convertir nada.
   */
  oldestRateAsOf: Date | null;
}

/**
 * Convierte y suma una lista de importes a una moneda de presentación.
 *
 * Los importes de la moneda de destino pasan derecho; el resto necesita una
 * cotización que cubra el par. Lo que no encuentra cotización se acumula en
 * `missing` por moneda, no se pierde y no se cuenta.
 */
export function valuate(amounts: readonly Money[], display: Currency, book: RateBook): Valuation {
  let totalCents = 0n;
  const missingByCurrency = new Map<Currency, bigint>();
  let oldestRateAsOf: Date | null = null;

  for (const amount of amounts) {
    if (amount.currency === display) {
      totalCents += amount.cents;
      continue;
    }

    const rate = findRate(book, amount.currency, display);
    const converted = rate ? convert(amount, display, rate) : null;

    if (!converted || !rate) {
      missingByCurrency.set(amount.currency, (missingByCurrency.get(amount.currency) ?? 0n) + amount.cents);
      continue;
    }

    totalCents += converted.cents;
    if (oldestRateAsOf === null || rate.asOf < oldestRateAsOf) oldestRateAsOf = rate.asOf;
  }

  // Una moneda cuyos importes se cancelan entre sí (por ejemplo, una
  // transferencia de ida y vuelta) no deja un hueco real en el total: no hay
  // nada que declarar, y declararlo sería alarmar sin motivo.
  const missing = [...missingByCurrency.entries()]
    .filter(([, cents]) => cents !== 0n)
    .map(([currency, cents]) => ({ currency, cents }))
    .sort((a, b) => a.currency.localeCompare(b.currency));

  return {
    currency: display,
    totalCents,
    missing,
    complete: missing.length === 0,
    oldestRateAsOf,
  };
}

/**
 * Valúa un único importe. Devuelve `null` cuando no hay cotización, para que
 * quien llama tenga que resolver el hueco en vez de heredar un cero.
 */
export function valuateOne(amount: Money, display: Currency, book: RateBook): Money | null {
  if (amount.currency === display) return amount;
  const rate = findRate(book, amount.currency, display);
  if (!rate) return null;
  return convert(amount, display, rate);
}

/**
 * Antigüedad de una cotización en días completos.
 *
 * Se mide en días y no en horas porque es la unidad en la que la respuesta
 * cambia una decisión: "de hoy" contra "de hace tres días" importa; "de hace
 * cuatro horas" no le cambia la vida a nadie.
 */
export function rateAgeDays(asOf: Date, now: Date): number {
  const elapsed = now.getTime() - asOf.getTime();
  if (elapsed <= 0) return 0;
  return Math.floor(elapsed / 86_400_000);
}

/**
 * Umbral a partir del cual una cotización deja de poder presentarse como
 * vigente. Dos días cubre un fin de semana largo sin declarar viejo algo que
 * simplemente esperó a que abriera el mercado.
 */
export const STALE_RATE_DAYS = 2;

export function isRateStale(asOf: Date, now: Date): boolean {
  return rateAgeDays(asOf, now) > STALE_RATE_DAYS;
}

/**
 * Reparte un total entre sus partes en proporción, sin perder ni inventar un
 * centavo. Los restos se asignan a las partes más grandes, que es donde un
 * centavo de diferencia es proporcionalmente menos visible.
 *
 * Se usa donde un porcentaje tiene que cerrar exactamente contra el total que
 * se muestra al lado: un desglose cuyas partes no suman el total destruye la
 * confianza en el total, aunque cada parte esté "bien redondeada".
 */
export function distributeProportionally(totalCents: bigint, weights: readonly bigint[]): bigint[] {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0n);
  if (totalWeight === 0n) return weights.map(() => 0n);

  const shares = weights.map((weight) => (totalCents * weight) / totalWeight);
  let remainder = totalCents - shares.reduce((sum, share) => sum + share, 0n);

  const order = weights
    .map((weight, index) => ({ weight, index }))
    .sort((a, b) => (b.weight > a.weight ? 1 : b.weight < a.weight ? -1 : a.index - b.index));

  const step = remainder < 0n ? -1n : 1n;
  for (const { index } of order) {
    if (remainder === 0n) break;
    shares[index] = shares[index]! + step;
    remainder -= step;
  }

  return shares;
}
