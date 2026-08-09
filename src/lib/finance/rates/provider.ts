/**
 * Proveedores de cotización.
 *
 * Un proveedor es una función que devuelve cotizaciones. Nada más. No escribe en
 * la base, no sabe de usuarios y recibe su `fetch` por parámetro, así que se
 * prueba entero sin red.
 *
 * La parte que importa de este archivo no es bajar un JSON: es **desconfiar de
 * él**. Una cotización mal leída no rompe la pantalla con un error visible;
 * multiplica en silencio el patrimonio de alguien por mil. Por eso el parser
 * rechaza y descarta en vez de completar con valores por defecto, y todo lo que
 * no entiende queda afuera con su motivo.
 */

import { RATE_SCALE, type Currency, type FxVariant } from "../currency";

/** Una cotización tal como la entrega un proveedor, ya normalizada. */
export interface ProviderRate {
  base: Currency;
  quote: Currency;
  variant: FxVariant;
  rateMicros: bigint;
  asOf: Date;
}

/** Lo que no se pudo leer, con el motivo. Se registra; no se convierte en dato. */
export interface RejectedRate {
  reason: string;
  raw: unknown;
}

export interface ProviderReading {
  rates: ProviderRate[];
  rejected: RejectedRate[];
}

export interface RateProvider {
  name: string;
  read(): Promise<ProviderReading>;
}

/**
 * Convierte un número decimal a millonésimas enteras.
 *
 * Es el único punto del dominio financiero donde entra un `number`, porque JSON
 * no tiene otra cosa, y sale convertido a `BigInt` en la misma expresión. La
 * multiplicación es exacta para las magnitudes reales de una cotización: un
 * double tiene 15 dígitos significativos y una cotización por un millón no pasa
 * de 11. Cualquier valor fuera de ese rango se rechaza antes de llegar acá.
 */
export function decimalToMicros(value: number): bigint | null {
  if (!Number.isFinite(value)) return null;
  if (value <= 0) return null;
  // El techo lo fija la precisión del double, no el gusto: un valor por un millón
  // tiene que seguir siendo un entero exacto, y `Number.MAX_SAFE_INTEGER` está en
  // 9,007 × 10¹⁵. Mil millones deja dos órdenes de magnitud de margen y alcanza
  // de sobra para un bitcoin en pesos, que hoy ronda los noventa millones.
  // El primer techo de este archivo eran diez millones, pensado sólo para
  // cotizaciones de moneda, y dejaba afuera precisamente a la cripto.
  if (value > 1_000_000_000) return null;
  const micros = Math.round(value * Number(RATE_SCALE));
  if (!Number.isSafeInteger(micros) || micros <= 0) return null;
  return BigInt(micros);
}

/**
 * Nombres de casa de dolarapi.com traducidos al tipo de cambio del dominio.
 *
 * `mayorista` queda deliberadamente afuera: es una cotización entre bancos a la
 * que una persona no accede, y ofrecerla como forma de leer el patrimonio propio
 * sería mostrar plata que no se puede obtener.
 */
const DOLAR_API_HOUSES: Record<string, FxVariant> = {
  oficial: "OFICIAL",
  blue: "BLUE",
  bolsa: "MEP",
  contadoconliqui: "CCL",
  cripto: "CRIPTO",
  tarjeta: "TARJETA",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Lee la respuesta de dolarapi.com.
 *
 * Se toma el precio de **venta**: es lo que cuesta conseguir un dólar, y por lo
 * tanto la respuesta honesta a "cuántos dólares es esto". Usar la compra
 * inflaría el patrimonio en dólares con una cotización a la que nadie compra.
 * La diferencia entre puntas queda sin modelar a propósito en este corte; el día
 * que haga falta, entra como una segunda cotización y no como un promedio, que
 * sería un número que no existe en ninguna pizarra.
 */
export function parseDolarApiPayload(payload: unknown): ProviderReading {
  if (!Array.isArray(payload)) {
    return { rates: [], rejected: [{ reason: "La respuesta no es una lista de cotizaciones.", raw: payload }] };
  }

  const rates: ProviderRate[] = [];
  const rejected: RejectedRate[] = [];

  for (const entry of payload) {
    if (!isRecord(entry)) {
      rejected.push({ reason: "Cotización que no es un objeto.", raw: entry });
      continue;
    }

    const house = typeof entry.casa === "string" ? entry.casa.toLowerCase() : null;
    const variant = house ? DOLAR_API_HOUSES[house] : undefined;
    if (!variant) {
      rejected.push({ reason: `Casa de cambio no contemplada: ${String(entry.casa)}.`, raw: entry });
      continue;
    }

    // El proveedor cotiza el dólar; si algún día cambia de moneda, no se asume.
    if (typeof entry.moneda === "string" && entry.moneda.toUpperCase() !== "USD") {
      rejected.push({ reason: `Moneda no contemplada: ${entry.moneda}.`, raw: entry });
      continue;
    }

    const rateMicros = typeof entry.venta === "number" ? decimalToMicros(entry.venta) : null;
    if (rateMicros === null) {
      rejected.push({ reason: "Precio de venta ausente o fuera de rango.", raw: entry });
      continue;
    }

    const asOf = typeof entry.fechaActualizacion === "string" ? new Date(entry.fechaActualizacion) : null;
    if (!asOf || Number.isNaN(asOf.getTime())) {
      rejected.push({ reason: "Fecha de actualización ilegible.", raw: entry });
      continue;
    }

    rates.push({ base: "USD", quote: "ARS", variant, rateMicros, asOf });
  }

  return { rates, rejected };
}

export const DOLAR_API_URL = "https://dolarapi.com/v1/dolares";

/** Cuánto se espera al proveedor antes de seguir sin él. */
export const PROVIDER_TIMEOUT_MS = 8_000;

/**
 * Proveedor de dólar argentino sobre dolarapi.com.
 *
 * El `fetch` entra por parámetro: eso lo vuelve probable sin red y permite
 * cambiar de proveedor sin tocar nada de lo que lo consume.
 *
 * Nunca lanza por un problema del proveedor. Una cotización que no se pudo bajar
 * es una lectura vacía, no una excepción: el patrimonio de la persona sigue
 * siendo verdadero en su moneda original, y la pantalla ya sabe decir que no
 * pudo convertir. Romper la pantalla porque una API pública no contestó sería
 * castigar al usuario por algo que no le pertenece.
 */
export function dolarApiProvider(
  fetchImpl: typeof fetch,
  options: { url?: string; timeoutMs?: number } = {},
): RateProvider {
  const url = options.url ?? DOLAR_API_URL;
  const timeoutMs = options.timeoutMs ?? PROVIDER_TIMEOUT_MS;

  return {
    name: "dolarapi.com",
    async read(): Promise<ProviderReading> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetchImpl(url, {
          signal: controller.signal,
          headers: { accept: "application/json" },
        });
        if (!response.ok) {
          return { rates: [], rejected: [{ reason: `El proveedor respondió ${response.status}.`, raw: null }] };
        }
        return parseDolarApiPayload(await response.json());
      } catch (error) {
        const reason = error instanceof Error && error.name === "AbortError"
          ? "El proveedor no respondió a tiempo."
          : "No se pudo contactar al proveedor.";
        return { rates: [], rejected: [{ reason, raw: null }] };
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
