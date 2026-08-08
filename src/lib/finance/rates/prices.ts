import "server-only";
import { getDb } from "../../db";
import { logServerError } from "../../observability";
import { isSupportedCurrency, type Currency } from "../currency";
import type { UnitPrice } from "../holdings";

/**
 * Precios de instrumentos.
 *
 * Misma forma que las cotizaciones de moneda, y por la misma razón: el precio de
 * una acción es información pública, así que la tabla no lleva propietario y una
 * sola lectura sirve para todas las personas.
 *
 * Se guarda una fila por publicación en vez de pisar un valor "actual". Eso
 * conserva a qué precio se leyó una cartera en cada momento, que es lo único que
 * permite entender después por qué un número de hace dos meses decía lo que
 * decía.
 */

/** Precio informado por un proveedor, ya normalizado. */
export interface ProviderPrice {
  symbol: string;
  currency: Currency;
  priceMicros: bigint;
  asOf: Date;
}

export interface PriceProvider {
  name: string;
  /** Sólo se piden los símbolos que alguien tiene: no se baja un mercado entero. */
  read(symbols: readonly string[]): Promise<{ prices: ProviderPrice[]; rejected: string[] }>;
}

/** Ventana en la que no se vuelve a molestar al proveedor. */
export const PRICE_REFRESH_TTL_MS = 15 * 60 * 1000;

/**
 * Proveedor con el que se registra un precio cargado por la persona.
 *
 * Existe porque hay tenencias que ningún proveedor cotiza —un fondo cerrado, un
 * plazo fijo, una participación en algo— y obligarlas a un valor total tipeado a
 * mano les negaría la única ventaja de contar por unidades: que cambiar el precio
 * actualice todo de una. La valuación lo distingue de un precio de mercado, para
 * que la pantalla nunca presente uno como el otro.
 */
export const MANUAL_PRICE_PROVIDER = "manual";

export const normalizeSymbol = (symbol: string): string => symbol.trim().toUpperCase();

/**
 * Últimos precios conocidos de los símbolos pedidos.
 *
 * Devuelve un mapa por símbolo normalizado, listo para `valuePortfolio`. Un
 * símbolo sin precio simplemente no aparece: quien valúa ya sabe caer al valor
 * declarado y decir que ese número no es de hoy.
 */
export async function loadLatestPrices(symbols: readonly string[]): Promise<Map<string, UnitPrice>> {
  const wanted = [...new Set(symbols.map(normalizeSymbol).filter(Boolean))];
  if (wanted.length === 0) return new Map();

  const rows = await getDb().assetPrice.findMany({
    where: { symbol: { in: wanted } },
    orderBy: { asOf: "desc" },
  });

  const latest = new Map<string, UnitPrice>();
  for (const row of rows) {
    // Las filas vienen de la más nueva a la más vieja: la primera de cada
    // símbolo es la vigente y el resto es historia.
    if (latest.has(row.symbol)) continue;
    if (!isSupportedCurrency(row.currency)) continue;
    latest.set(row.symbol, {
      symbol: row.symbol,
      currency: row.currency,
      priceMicros: row.priceMicros,
      asOf: row.asOf,
      // El centinela de "lo cargó la persona" se traduce a `null` acá y no en el
      // módulo de valuación: el núcleo puro no tiene por qué conocer el nombre
      // que la infraestructura eligió para esa fila.
      provider: row.provider === MANUAL_PRICE_PROVIDER ? null : row.provider,
    });
  }
  return latest;
}

export interface PriceRefreshOutcome {
  stored: number;
  unchanged: number;
  /** Símbolos que el proveedor no supo cotizar. Se informan, no se ocultan. */
  rejected: string[];
  skipped: boolean;
}

/**
 * Trae precios del proveedor y guarda los que falten.
 *
 * Idempotente por construcción: la clave única es `(symbol, currency, asOf)`, así
 * que releer la misma publicación no crea una fila nueva.
 *
 * Nunca lanza. Un proveedor caído deja la cartera leyéndose con el último precio
 * conocido, que es exactamente lo que la persona esperaría: su plata no cambió
 * porque una API no contestó.
 */
export async function refreshPrices(
  provider: PriceProvider,
  symbols: readonly string[],
  now = new Date(),
): Promise<PriceRefreshOutcome> {
  const wanted = [...new Set(symbols.map(normalizeSymbol).filter(Boolean))];
  if (wanted.length === 0) return { stored: 0, unchanged: 0, rejected: [], skipped: false };

  const db = getDb();
  const lastFetch = await db.assetPrice.findFirst({
    where: { provider: provider.name, symbol: { in: wanted } },
    orderBy: { fetchedAt: "desc" },
    select: { fetchedAt: true },
  });
  if (lastFetch && now.getTime() - lastFetch.fetchedAt.getTime() < PRICE_REFRESH_TTL_MS) {
    return { stored: 0, unchanged: 0, rejected: [], skipped: true };
  }

  let reading: Awaited<ReturnType<PriceProvider["read"]>>;
  try {
    reading = await provider.read(wanted);
  } catch {
    logServerError({ route: "/prices", operation: "read-prices", code: "provider-failed" });
    return { stored: 0, unchanged: 0, rejected: [...wanted], skipped: false };
  }

  let stored = 0;
  let unchanged = 0;

  for (const price of reading.prices) {
    try {
      await db.assetPrice.create({
        data: {
          symbol: normalizeSymbol(price.symbol),
          currency: price.currency,
          priceMicros: price.priceMicros,
          provider: provider.name,
          asOf: price.asOf,
          fetchedAt: now,
        },
      });
      stored += 1;
    } catch (error) {
      // P2002: esa publicación ya estaba. Es el caso normal cuando el proveedor
      // no actualizó desde la última lectura, no un fallo.
      if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
        unchanged += 1;
        continue;
      }
      logServerError({ route: "/prices", operation: "store-price", code: "write-failed" });
    }
  }

  return { stored, unchanged, rejected: reading.rejected, skipped: false };
}

/** Guarda un precio cargado por la persona. */
export async function setManualPrice(input: {
  symbol: string;
  currency: Currency;
  priceMicros: bigint;
  asOf: Date;
}): Promise<void> {
  const symbol = normalizeSymbol(input.symbol);
  await getDb().assetPrice.upsert({
    where: {
      symbol_currency_asOf: { symbol, currency: input.currency, asOf: input.asOf },
    },
    create: {
      symbol,
      currency: input.currency,
      priceMicros: input.priceMicros,
      provider: MANUAL_PRICE_PROVIDER,
      asOf: input.asOf,
    },
    update: { priceMicros: input.priceMicros, provider: MANUAL_PRICE_PROVIDER },
  });
}
