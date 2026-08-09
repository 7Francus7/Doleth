/**
 * Precios de cripto en pesos, desde CriptoYa.
 *
 * Es el primer proveedor de precios real del producto y cubre un caso acotado a
 * propósito: cripto contra pesos. Acciones y CEDEARs quedan afuera porque no hay
 * una fuente pública y gratuita que los publique de forma confiable, y ofrecer un
 * botón que dice "actualizar precios" y silenciosamente no actualiza la mitad de
 * la cartera sería peor que no tener el botón.
 *
 * Lo que **sí** hace este archivo es decir qué símbolos no supo cotizar, para que
 * la pantalla los nombre y la persona sepa cuáles siguen dependiendo de un precio
 * cargado a mano.
 *
 * El `fetch` entra por parámetro: se prueba entero sin red.
 */

import { RATE_SCALE, type Currency } from "../currency";
import { decimalToMicros } from "./provider";
import type { PriceProvider, PriceRejection, ProviderPrice } from "./prices";

export const CRYPTOYA_BASE_URL = "https://criptoya.com/api";

/** Cuánto se espera antes de seguir sin el proveedor. */
export const PRICE_TIMEOUT_MS = 8_000;

/**
 * Símbolos que este proveedor sabe pedir.
 *
 * La lista es explícita y no un "probemos y veamos": pedirle al proveedor un
 * símbolo que no existe devuelve un error que no se distingue de una caída, y
 * eso convertiría un símbolo mal escrito en "el proveedor está caído".
 */
export const SUPPORTED_CRYPTO = ["BTC", "ETH", "USDT", "USDC", "DAI", "SOL", "BNB", "ADA", "DOT", "LTC"] as const;

const isSupportedCrypto = (symbol: string): boolean =>
  (SUPPORTED_CRYPTO as readonly string[]).includes(symbol.toUpperCase());

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Lee la respuesta de CriptoYa para una moneda.
 *
 * El endpoint devuelve un objeto con una entrada por exchange, cada una con su
 * precio de compra y de venta. Se toma la **mediana de los precios de venta**:
 * el promedio se corre con un exchange que publicó un valor absurdo, y tomar un
 * exchange fijo ataría el precio de la cartera de alguien a que ese exchange siga
 * existiendo.
 */
export function parseCryptoYaPayload(symbol: string, payload: unknown): ProviderPrice | null {
  if (!isRecord(payload)) return null;

  const asks: bigint[] = [];
  for (const entry of Object.values(payload)) {
    if (!isRecord(entry)) continue;
    const ask = entry.ask ?? entry.totalAsk;
    if (typeof ask !== "number") continue;
    const micros = decimalToMicros(ask);
    if (micros !== null) asks.push(micros);
  }

  if (asks.length === 0) return null;

  asks.sort((left, right) => (left > right ? 1 : left < right ? -1 : 0));
  const middle = Math.floor(asks.length / 2);
  const priceMicros =
    asks.length % 2 === 1 ? asks[middle]! : (asks[middle - 1]! + asks[middle]!) / 2n;

  return {
    symbol: symbol.toUpperCase(),
    currency: "ARS" as Currency,
    priceMicros,
    // El endpoint no publica un momento por moneda: se declara el de la lectura,
    // que es lo único cierto. Inventar una hora anterior sería peor.
    asOf: new Date(),
  };
}

/**
 * Proveedor de precios de cripto.
 *
 * Nunca lanza. Un símbolo que falla queda en `rejected` y los demás siguen: que
 * una moneda no responda no puede dejar sin actualizar al resto de la cartera.
 */
export function cryptoYaProvider(
  fetchImpl: typeof fetch,
  options: { baseUrl?: string; timeoutMs?: number; now?: () => Date } = {},
): PriceProvider {
  const baseUrl = options.baseUrl ?? CRYPTOYA_BASE_URL;
  const timeoutMs = options.timeoutMs ?? PRICE_TIMEOUT_MS;

  return {
    name: "criptoya.com",
    async read(symbols) {
      const prices: ProviderPrice[] = [];
      const rejected: PriceRejection[] = [];

      for (const raw of symbols) {
        const symbol = raw.trim().toUpperCase();
        // Fuera del catálogo: es permanente. La persona necesita saber que este
        // botón nunca va a cotizarlo y que tiene que cargar el precio a mano.
        if (!isSupportedCrypto(symbol)) {
          rejected.push({ symbol, reason: "unsupported" });
          continue;
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const response = await fetchImpl(`${baseUrl}/${symbol.toLowerCase()}/ars/1`, {
            signal: controller.signal,
            headers: { accept: "application/json" },
          });
          if (!response.ok) {
            rejected.push({ symbol, reason: "unavailable" });
            continue;
          }
          const parsed = parseCryptoYaPayload(symbol, await response.json());
          if (parsed) {
            prices.push(options.now ? { ...parsed, asOf: options.now() } : parsed);
          } else {
            rejected.push({ symbol, reason: "unavailable" });
          }
        } catch {
          // Red caída, timeout o respuesta ilegible: es pasajero y se reintenta.
          rejected.push({ symbol, reason: "unavailable" });
        } finally {
          clearTimeout(timer);
        }
      }

      return { prices, rejected };
    },
  };
}

/** Un dólar vale un dólar: sirve para valuar tenencias en USDT y USDC. */
export const STABLECOIN_USD_PRICE_MICROS = RATE_SCALE;
