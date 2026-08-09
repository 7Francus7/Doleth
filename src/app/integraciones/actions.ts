"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "../../lib/db";
import { UnauthorizedError, requireOnboardedUserForAction } from "../../lib/auth/guards";
import { dolarApiProvider } from "../../lib/finance/rates/provider";
import { cryptoYaProvider } from "../../lib/finance/rates/cryptoProvider";
import { refreshMarketRates } from "../../lib/finance/rates/store";
import { refreshPrices } from "../../lib/finance/rates/prices";
import { logServerError } from "../../lib/observability";
import type { AccountState } from "../../lib/auth/form-state";

/**
 * Integraciones, a un botón.
 *
 * Cada integración es una fuente externa que Doleth consulta para poder mostrar
 * números que no vienen del ledger: cuánto vale un dólar, cuánto vale un
 * bitcoin. Todas comparten la misma forma y las mismas garantías.
 *
 * 1. **Nada es automático sin pedirlo.** La persona aprieta y pasa; no hay
 *    tareas de fondo tocando su cuenta sin que lo sepa.
 * 2. **Ninguna falla rompe nada.** Si la fuente no contesta, la app sigue con lo
 *    último que tenía y lo dice. Su plata no cambió porque una API se cayó.
 * 3. **El resultado siempre se cuenta**, incluido lo que no se pudo: un botón
 *    que dice "listo" habiendo actualizado la mitad es peor que uno que falla.
 */

const failure = (message: string): AccountState => ({ status: "error", message, errors: {} });
const success = (message: string): AccountState => ({ status: "success", message, errors: {} });

function toState(error: unknown, operation: string): AccountState {
  if (error instanceof UnauthorizedError) {
    return failure("Tu sesión venció. Volvé a iniciar sesión para continuar.");
  }
  logServerError({ route: "/integraciones", operation, code: "unexpected" });
  return failure("No pudimos completar la conexión. Probá de nuevo en un momento.");
}

function refreshSurfaces() {
  revalidatePath("/ahora");
  revalidatePath("/inversiones");
  revalidatePath("/integraciones");
  revalidatePath("/configuracion/moneda");
}

const plural = (count: number, one: string, many: string) => (count === 1 ? one : many);

/**
 * Trae la cotización del dólar.
 *
 * Sin ella, todo lo que esté en otra moneda queda declarado aparte en vez de
 * sumarse al patrimonio. Es la integración que más cambia lo que se ve en
 * pantalla, y por eso es la primera.
 */
export async function connectDollarAction(): Promise<AccountState> {
  try {
    await requireOnboardedUserForAction();
    const outcome = await refreshMarketRates(dolarApiProvider(fetch));

    if (outcome.skipped) {
      return success("Las cotizaciones ya estaban al día. Se actualizan como mucho cada quince minutos.");
    }
    if (outcome.stored === 0 && outcome.unchanged === 0) {
      return failure(
        "No pudimos contactar a dolarapi.com. Tu plata se sigue leyendo con la última cotización que teníamos; también podés cargar la tuya en Moneda.",
      );
    }

    refreshSurfaces();
    return success(
      outcome.stored > 0
        ? `Listo: ${outcome.stored} ${plural(outcome.stored, "cotización nueva", "cotizaciones nuevas")}.`
        : "Ya tenías la última cotización publicada.",
    );
  } catch (error) {
    return toState(error, "connect-dollar");
  }
}

/**
 * Trae el precio de las cripto que la persona tiene.
 *
 * Sólo se piden los símbolos de sus tenencias: no se baja un mercado entero para
 * alguien que tiene una sola moneda. Si no tiene ninguna, se lo dice en vez de
 * hacer una llamada que no sirve para nada.
 */
export async function connectCryptoPricesAction(): Promise<AccountState> {
  try {
    const user = await requireOnboardedUserForAction();

    const investments = await getDb().investment.findMany({
      where: { userId: user.id, status: "ACTIVE", symbol: { not: null }, quantityMicros: { not: null } },
      select: { symbol: true },
    });
    const symbols = [...new Set(investments.map((item) => item.symbol!.trim().toUpperCase()))];

    if (symbols.length === 0) {
      return failure(
        "Todavía no tenés ninguna tenencia con cantidad y símbolo. Cargá una en Inversiones y este botón va a poder buscarle el precio.",
      );
    }

    const outcome = await refreshPrices(cryptoYaProvider(fetch), symbols);

    if (outcome.skipped) {
      return success("Los precios ya estaban al día. Se actualizan como mucho cada quince minutos.");
    }

    const updated = outcome.stored;

    // Los dos motivos se cuentan por separado, y no es cosmético: "no lo cubro"
    // es permanente y pide cargar el precio a mano, "no pude consultarlo" es
    // pasajero y pide reintentar. Mezclarlos haría que un corte de red se lea
    // como una limitación del producto.
    const unsupported = outcome.rejected.filter((item) => item.reason === "unsupported").map((item) => item.symbol);
    const unavailable = outcome.rejected.filter((item) => item.reason === "unavailable").map((item) => item.symbol);

    const notes = [
      unsupported.length > 0
        ? `Todavía no sabemos cotizar ${unsupported.join(", ")}: para esos, cargá el precio a mano en Inversiones.`
        : null,
      unavailable.length > 0
        ? `No pudimos consultar ${unavailable.join(", ")} en este momento; probá de nuevo en un rato.`
        : null,
    ].filter(Boolean);
    const tail = notes.length > 0 ? ` ${notes.join(" ")}` : "";

    if (updated === 0 && outcome.unchanged === 0) {
      return failure(`No pudimos traer ningún precio.${tail}`);
    }

    refreshSurfaces();
    return success(
      `${updated > 0 ? `Listo: ${updated} ${plural(updated, "precio actualizado", "precios actualizados")}.` : "No había precios nuevos publicados."}${tail}`,
    );
  } catch (error) {
    return toState(error, "connect-crypto-prices");
  }
}
