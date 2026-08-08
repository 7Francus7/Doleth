"use client";

import { useActionState } from "react";
import {
  refreshRatesAction,
  setManualRateAction,
  updateDisplayPreferencesAction,
} from "../../app/configuracion/moneda/actions";
import { emptyAccountState } from "../../lib/auth/form-state";
import { FX_VARIANTS, FX_VARIANT_LABELS, SUPPORTED_CURRENCIES } from "../../lib/finance/currency";
import { AuthSubmit, TextField } from "../auth/fields";
import styles from "../auth/auth.module.css";
import settings from "../auth/settings.module.css";

/**
 * Elegir en qué moneda se lee la plata.
 *
 * La pantalla dice en todos lados lo mismo, porque es lo que hace que la persona
 * se anime a tocarla: nada de esto cambia lo registrado. Es una lente, no una
 * conversión de datos.
 */

function Feedback({ state }: { state: { status: string; message: string } }) {
  if (state.status === "idle" || !state.message) return null;
  return (
    <p
      className={state.status === "success" ? styles.success : styles.error}
      role={state.status === "success" ? "status" : "alert"}
      tabIndex={-1}
    >
      {state.message}
    </p>
  );
}

const CURRENCY_OPTION_LABELS: Record<string, string> = {
  ARS: "Pesos argentinos",
  USD: "Dólares",
};

/**
 * Qué significa cada tipo de cambio, en una línea.
 *
 * Sin esto la lista es jerga: "CCL" no le dice nada a la mayoría de las personas
 * que igual necesitan elegir. Doleth no puede pedir una decisión que no explica.
 */
const FX_VARIANT_HINTS: Record<string, string> = {
  OFICIAL: "El del banco, con las restricciones que eso implica.",
  BLUE: "El informal. Es el que la mayoría usa como referencia.",
  MEP: "Dólar bolsa: legal, se consigue comprando y vendiendo bonos.",
  CCL: "Contado con liquidación: el que se usa para sacar plata del país.",
  CRIPTO: "El que sale de comprar stablecoins.",
  TARJETA: "El que te cobran al pagar en el exterior, con impuestos.",
  MANUAL: "La que vos cargues abajo. Útil si compraste a un precio concreto.",
};

export function DisplayPreferencesSection({
  defaults,
  activeRate,
}: {
  defaults: { displayCurrency: string; fxVariant: string };
  /** Cotización vigente, ya formateada, o `null` si todavía no hay ninguna. */
  activeRate: string | null;
}) {
  const [state, action] = useActionState(updateDisplayPreferencesAction, emptyAccountState);

  return (
    <form action={action} className={styles.form} noValidate>
      <Feedback state={state} />

      <div className={styles.field}>
        <label htmlFor="displayCurrency">Leer mi plata en</label>
        <select defaultValue={defaults.displayCurrency} id="displayCurrency" name="displayCurrency" required>
          {SUPPORTED_CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {CURRENCY_OPTION_LABELS[currency] ?? currency}
            </option>
          ))}
        </select>
        {state.errors.displayCurrency ? (
          <span className={styles.fieldError}>{state.errors.displayCurrency}</span>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor="fxVariant">Con qué dólar</label>
        <select defaultValue={defaults.fxVariant} id="fxVariant" name="fxVariant" required>
          {FX_VARIANTS.map((variant) => (
            <option key={variant} value={variant}>
              {FX_VARIANT_LABELS[variant]}
            </option>
          ))}
        </select>
        <span className={styles.hint}>
          {FX_VARIANT_HINTS[defaults.fxVariant] ?? "Elegí el que uses como referencia."}
        </span>
        {state.errors.fxVariant ? <span className={styles.fieldError}>{state.errors.fxVariant}</span> : null}
      </div>

      <p className={settings.sectionIntro}>
        {activeRate
          ? `Ahora mismo Doleth convierte a ${activeRate}.`
          : "Todavía no hay una cotización cargada para este tipo de cambio, así que lo que esté en otra moneda va a quedar declarado aparte en vez de sumarse."}
      </p>

      <AuthSubmit pendingLabel="Guardando…">Guardar</AuthSubmit>
    </form>
  );
}

export function RefreshRatesSection({ lastUpdated }: { lastUpdated: string | null }) {
  const [state, action] = useActionState(refreshRatesAction, emptyAccountState);

  return (
    <form action={action} className={styles.form}>
      <Feedback state={state} />
      <p className={settings.sectionIntro}>
        {lastUpdated
          ? `Última cotización pública guardada: ${lastUpdated}`
          : "Todavía no bajamos ninguna cotización pública."}
      </p>
      <AuthSubmit pendingLabel="Buscando…">Traer cotizaciones de hoy</AuthSubmit>
    </form>
  );
}

export function ManualRateSection({ current }: { current: { rate: string; note: string | null } | null }) {
  const [state, action] = useActionState(setManualRateAction, emptyAccountState);

  return (
    <form action={action} className={styles.form} noValidate>
      <Feedback state={state} />
      <TextField
        defaultValue={current?.rate ?? ""}
        error={state.errors.rate}
        hint="Cuántos pesos vale un dólar para vos. Por ejemplo, 1.400,50."
        inputMode="decimal"
        label="Tu cotización"
        name="rate"
        required
      />
      <TextField
        defaultValue={current?.note ?? ""}
        error={state.errors.note}
        hint="Opcional. Para acordarte de dónde salió."
        label="Nota"
        maxLength={120}
        name="note"
      />
      <AuthSubmit pendingLabel="Guardando…">Guardar mi cotización</AuthSubmit>
    </form>
  );
}
