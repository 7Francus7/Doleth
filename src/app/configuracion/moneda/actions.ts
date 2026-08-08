"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "../../../lib/db";
import { UnauthorizedError, requireSessionForAction } from "../../../lib/auth/guards";
import { FX_VARIANT_LABELS, isFxVariant, isSupportedCurrency, parseRateInput } from "../../../lib/finance/currency";
import { dolarApiProvider } from "../../../lib/finance/rates/provider";
import { QUOTED_BASE, QUOTED_QUOTE, refreshMarketRates } from "../../../lib/finance/rates/store";
import { logServerError } from "../../../lib/observability";
import type { AccountState } from "../../../lib/auth/form-state";

/**
 * Preferencias de lectura de la plata.
 *
 * Ninguna de estas acciones toca el ledger. Cambiar de pesos a dólares, elegir
 * otro tipo de cambio o cargar una cotización propia cambia **cómo se lee** el
 * patrimonio, nunca lo que pasó: los importes guardados siguen exactamente igual
 * y cada movimiento conserva la moneda en la que ocurrió.
 *
 * Esa separación es la que permite cambiar de opinión sin miedo. Si elegir el
 * dólar blue reescribiera algo, nadie se animaría a probar cómo se ve su
 * patrimonio al oficial.
 */

const failure = (message: string, errors: Record<string, string> = {}): AccountState => ({
  status: "error",
  message,
  errors,
});

const success = (message: string): AccountState => ({ status: "success", message, errors: {} });

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

function toState(error: unknown, operation: string): AccountState {
  if (error instanceof UnauthorizedError) {
    return failure("Tu sesión venció. Volvé a iniciar sesión para continuar.");
  }
  logServerError({ route: "/configuracion/moneda", operation, code: "unexpected" });
  return failure("No pudimos guardar la preferencia. Probá de nuevo en un momento.");
}

/** Refresca todas las superficies que muestran importes convertidos. */
function refreshReadings() {
  revalidatePath("/ahora");
  revalidatePath("/cuentas");
  revalidatePath("/movimientos");
  revalidatePath("/inversiones");
  revalidatePath("/mi-realidad");
  revalidatePath("/configuracion/moneda");
}

/**
 * Elige en qué moneda se lee el patrimonio y con qué tipo de cambio.
 *
 * Las dos cosas se guardan juntas porque juntas forman una sola decisión: "en
 * dólares" sin decir a qué dólar no significa nada en Argentina.
 */
export async function updateDisplayPreferencesAction(
  _previous: AccountState,
  formData: FormData,
): Promise<AccountState> {
  try {
    const { user } = await requireSessionForAction();
    const displayCurrency = text(formData, "displayCurrency").toUpperCase();
    const fxVariant = text(formData, "fxVariant").toUpperCase();

    if (!isSupportedCurrency(displayCurrency)) {
      return failure("Elegí una moneda que Doleth sepa cotizar.", { displayCurrency: "Moneda no admitida." });
    }
    if (!isFxVariant(fxVariant)) {
      return failure("Elegí un tipo de cambio válido.", { fxVariant: "Tipo de cambio no admitido." });
    }

    // Elegir "tu cotización" sin haber cargado ninguna dejaría el patrimonio sin
    // poder convertirse: la pantalla lo declararía como incompleto y la persona
    // no tendría forma de saber por qué. Se avisa acá, antes de guardarlo.
    if (fxVariant === "MANUAL") {
      const own = await getDb().manualRate.findFirst({
        where: { userId: user.id, baseCurrency: QUOTED_BASE, quoteCurrency: QUOTED_QUOTE },
      });
      if (!own) {
        return failure("Todavía no cargaste una cotización propia. Cargala primero acá abajo.", {
          fxVariant: "Sin cotización propia.",
        });
      }
    }

    await getDb().user.update({ where: { id: user.id }, data: { displayCurrency, fxVariant } });
    refreshReadings();

    return success(
      displayCurrency === "ARS"
        ? `Vas a leer tu plata en pesos, con el dólar ${FX_VARIANT_LABELS[fxVariant].toLowerCase()}.`
        : `Vas a leer tu plata en dólares, al ${FX_VARIANT_LABELS[fxVariant].toLowerCase()}.`,
    );
  } catch (error) {
    return toState(error, "update-display-preferences");
  }
}

/**
 * Guarda la cotización propia de la persona.
 *
 * Se guarda una fila por fecha en vez de pisar un único valor: así queda la
 * historia de a qué precio leyó su patrimonio en cada momento, que es
 * exactamente lo que haría falta para entender después por qué un número de hace
 * dos meses decía lo que decía.
 */
export async function setManualRateAction(_previous: AccountState, formData: FormData): Promise<AccountState> {
  try {
    const { user } = await requireSessionForAction();
    const rateMicros = parseRateInput(text(formData, "rate"));
    const note = text(formData, "note") || null;

    if (rateMicros === null) {
      return failure("Escribí una cotización válida, por ejemplo 1.400,50.", { rate: "Cotización inválida." });
    }
    if (note && note.length > 120) {
      return failure("La nota admite hasta 120 caracteres.", { note: "Nota demasiado larga." });
    }

    // La fecha es el día civil, no el instante: dos ajustes el mismo día son la
    // misma decisión corregida, no dos cotizaciones distintas.
    const asOf = new Date(new Date().toISOString().slice(0, 10));

    await getDb().manualRate.upsert({
      where: {
        userId_baseCurrency_quoteCurrency_asOf: {
          userId: user.id,
          baseCurrency: QUOTED_BASE,
          quoteCurrency: QUOTED_QUOTE,
          asOf,
        },
      },
      create: {
        userId: user.id,
        baseCurrency: QUOTED_BASE,
        quoteCurrency: QUOTED_QUOTE,
        rateMicros,
        asOf,
        ...(note ? { note } : {}),
      },
      update: { rateMicros, note },
    });

    refreshReadings();
    return success("Cotización guardada. Elegí “tu cotización” arriba para leer tu plata con ella.");
  } catch (error) {
    return toState(error, "set-manual-rate");
  }
}

/**
 * Trae las cotizaciones públicas del día.
 *
 * Nunca falla hacia el usuario: si el proveedor no contesta, se lo dice y su
 * patrimonio sigue leyéndose con la última cotización guardada. Una API pública
 * caída no es un problema de la persona que está mirando su plata.
 */
// No declara parámetros: no usa ni el estado previo ni el formulario, y una
// función de menor aridad es asignable donde se espera una de dos argumentos.
export async function refreshRatesAction(): Promise<AccountState> {
  try {
    await requireSessionForAction();
    const outcome = await refreshMarketRates(dolarApiProvider(fetch));

    if (outcome.skipped) {
      return success("Las cotizaciones ya estaban al día. Se actualizan como mucho cada quince minutos.");
    }
    if (outcome.stored === 0 && outcome.unchanged === 0) {
      return failure(
        "No pudimos traer las cotizaciones ahora. Tu plata se sigue leyendo con la última que teníamos.",
      );
    }

    refreshReadings();
    return success(
      outcome.stored > 0
        ? `Cotizaciones actualizadas: ${outcome.stored} ${outcome.stored === 1 ? "nueva" : "nuevas"}.`
        : "No había cotizaciones nuevas publicadas.",
    );
  } catch (error) {
    return toState(error, "refresh-rates");
  }
}
