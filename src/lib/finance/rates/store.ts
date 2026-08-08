import "server-only";
import { getDb } from "../../db";
import { logServerError } from "../../observability";
import { isFxVariant, isSupportedCurrency, type Currency, type ExchangeRate, type FxVariant } from "../currency";
import { isRateStale, type RateBook } from "../valuation";
import type { RateProvider } from "./provider";

/**
 * Persistencia y resolución de cotizaciones.
 *
 * Separa dos cosas que se confunden fácil:
 *
 * - **Guardar** lo que dijo un proveedor (`refreshMarketRates`), que es
 *   información pública y compartida entre todas las personas.
 * - **Resolver** con qué cotización lee su patrimonio una persona concreta
 *   (`resolveRateBook`), que depende de una preferencia suya.
 *
 * La regla de resolución es una sola y no tiene excepciones: **manda el tipo de
 * cambio que la persona eligió**. Si eligió MANUAL, se usa su cotización propia
 * y no se cae de vuelta al mercado; si eligió BLUE, se usa el blue aunque tenga
 * una cotización propia cargada. Un sistema que decide por su cuenta cuál usar
 * hace que el mismo patrimonio muestre dos números distintos sin que nadie haya
 * cambiado nada, que es exactamente la sensación que Doleth existe para eliminar.
 */

/** Par que el producto cotiza hoy. La moneda fuerte es siempre la base. */
export const QUOTED_BASE: Currency = "USD";
export const QUOTED_QUOTE: Currency = "ARS";

/** Ventana en la que no se vuelve a molestar al proveedor. */
export const REFRESH_TTL_MS = 15 * 60 * 1000;

export interface ResolvedRateBook extends RateBook {
  /** Moneda en la que la persona pidió leer su dinero. */
  displayCurrency: Currency;
  /** Tipo de cambio elegido. */
  variant: FxVariant;
  /** La cotización en uso, o `null` si no hay ninguna para esa elección. */
  active: ExchangeRate | null;
  /** `true` cuando la cotización activa ya no puede presentarse como vigente. */
  stale: boolean;
}

const toExchangeRate = (row: {
  baseCurrency: string;
  quoteCurrency: string;
  rateMicros: bigint;
  asOf: Date;
}, variant: FxVariant, provider: string | null): ExchangeRate | null => {
  if (!isSupportedCurrency(row.baseCurrency) || !isSupportedCurrency(row.quoteCurrency)) return null;
  return {
    base: row.baseCurrency,
    quote: row.quoteCurrency,
    rateMicros: row.rateMicros,
    variant,
    asOf: row.asOf,
    provider,
  };
};

/**
 * Preferencias de lectura de una persona, saneadas.
 *
 * Los valores llegan de la base, pero una columna de texto puede contener
 * cualquier cosa tras una migración a medias o una carga manual. Ante algo que
 * el producto no sabe cotizar se vuelve a pesos: es la lectura que siempre es
 * verdadera, porque el ledger ya está en la moneda de cada cuenta.
 */
export async function getDisplayPreferences(
  userId: string,
): Promise<{ displayCurrency: Currency; variant: FxVariant }> {
  const user = await getDb().user.findUnique({
    where: { id: userId },
    select: { displayCurrency: true, fxVariant: true },
  });
  const displayCurrency =
    user && isSupportedCurrency(user.displayCurrency) ? user.displayCurrency : QUOTED_QUOTE;
  const variant = user && isFxVariant(user.fxVariant) ? user.fxVariant : "BLUE";
  return { displayCurrency, variant };
}

/**
 * Arma el libro de cotizaciones con el que se lee el patrimonio de una persona.
 *
 * Nunca lanza por falta de cotización: devuelve un libro vacío y `active` en
 * `null`. Quien valúa ya sabe declarar lo que no pudo convertir, y esa es la
 * respuesta correcta —"no sé cuánto es esto en dólares"— en vez de un error que
 * tapa el saldo verdadero en pesos.
 */
export async function resolveRateBook(userId: string, now = new Date()): Promise<ResolvedRateBook> {
  const { displayCurrency, variant } = await getDisplayPreferences(userId);

  const active = await (variant === "MANUAL"
    ? loadManualRate(userId)
    : loadMarketRate(variant));

  return {
    displayCurrency,
    variant,
    active,
    stale: active ? isRateStale(active.asOf, now) : false,
    rates: active ? [active] : [],
  };
}

/** La cotización propia más reciente de la persona. */
async function loadManualRate(userId: string): Promise<ExchangeRate | null> {
  const row = await getDb().manualRate.findFirst({
    where: { userId, baseCurrency: QUOTED_BASE, quoteCurrency: QUOTED_QUOTE },
    orderBy: { asOf: "desc" },
  });
  return row ? toExchangeRate(row, "MANUAL", null) : null;
}

/** La cotización pública más reciente del tipo de cambio pedido. */
async function loadMarketRate(variant: FxVariant): Promise<ExchangeRate | null> {
  const row = await getDb().marketRate.findFirst({
    where: { baseCurrency: QUOTED_BASE, quoteCurrency: QUOTED_QUOTE, variant },
    orderBy: { asOf: "desc" },
  });
  return row ? toExchangeRate(row, variant, row.provider) : null;
}

export interface RefreshOutcome {
  /** Cotizaciones nuevas efectivamente guardadas. */
  stored: number;
  /** Cotizaciones que ya estaban: el proveedor no publicó nada más nuevo. */
  unchanged: number;
  /** Lecturas descartadas por el parser, con su motivo. */
  rejected: number;
  /** `true` cuando ni se consultó al proveedor por estar dentro de la ventana. */
  skipped: boolean;
}

/**
 * Trae las cotizaciones del proveedor y guarda las que falten.
 *
 * Es idempotente por construcción: la clave única es
 * `(base, quote, variant, asOf)`, así que volver a leer la misma publicación no
 * crea una fila nueva. Eso también preserva la historia —cada publicación queda
 * como una fila propia— en vez de pisar un único valor "actual", que es lo que
 * haría imposible saber después a qué cotización se leyó algo.
 *
 * Nunca lanza. Un proveedor caído deja el resultado en cero y la aplicación
 * sigue con la última cotización que ya tenía.
 */
export async function refreshMarketRates(provider: RateProvider, now = new Date()): Promise<RefreshOutcome> {
  const db = getDb();

  const lastFetch = await db.marketRate.findFirst({
    where: { provider: provider.name },
    orderBy: { fetchedAt: "desc" },
    select: { fetchedAt: true },
  });
  if (lastFetch && now.getTime() - lastFetch.fetchedAt.getTime() < REFRESH_TTL_MS) {
    return { stored: 0, unchanged: 0, rejected: 0, skipped: true };
  }

  const reading = await provider.read();
  let stored = 0;
  let unchanged = 0;

  for (const rate of reading.rates) {
    try {
      await db.marketRate.create({
        data: {
          baseCurrency: rate.base,
          quoteCurrency: rate.quote,
          variant: rate.variant,
          rateMicros: rate.rateMicros,
          provider: provider.name,
          asOf: rate.asOf,
          fetchedAt: now,
        },
      });
      stored += 1;
    } catch (error) {
      // P2002: esa publicación ya estaba guardada. Es el caso normal cuando el
      // proveedor no actualizó desde la última lectura, no un fallo.
      if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
        unchanged += 1;
        continue;
      }
      logServerError({ route: "/rates", operation: "store-market-rate", code: "write-failed" });
    }
  }

  if (reading.rejected.length > 0) {
    logServerError({ route: "/rates", operation: "read-market-rates", code: "rates-rejected" });
  }

  return { stored, unchanged, rejected: reading.rejected.length, skipped: false };
}
