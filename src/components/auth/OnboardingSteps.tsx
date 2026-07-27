"use client";

import { useActionState } from "react";
import {
  createFirstAccountAction,
  savePreferencesAction,
  startOnboardingAction,
} from "../../app/onboarding/actions";
import { emptyOnboardingState } from "../../lib/auth/form-state";
import { currencyOptions, localeOptions, timeZoneOptions } from "../../lib/auth/validation";
import { AuthSubmit, TextField } from "./fields";
import styles from "./auth.module.css";

const TIME_ZONE_LABELS: Record<string, string> = {
  "America/Argentina/Buenos_Aires": "Buenos Aires (GMT-3)",
  "America/Argentina/Cordoba": "Córdoba (GMT-3)",
  "America/Argentina/Mendoza": "Mendoza (GMT-3)",
  "America/Argentina/Salta": "Salta (GMT-3)",
  "America/Argentina/Tucuman": "Tucumán (GMT-3)",
  "America/Montevideo": "Montevideo (GMT-3)",
  "America/Santiago": "Santiago de Chile",
  "Europe/Madrid": "Madrid",
};

const LOCALE_LABELS: Record<string, string> = {
  "es-AR": "Español (Argentina) · 1.234,56",
  "es-ES": "Español (España) · 1.234,56",
};

const ACCOUNT_TYPES = [
  ["CASH", "Efectivo"],
  ["BANK", "Cuenta bancaria"],
  ["WALLET", "Billetera virtual"],
  ["SAVINGS", "Ahorro"],
  ["OTHER", "Otra"],
] as const;

export function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  return (
    <p className={styles.steps}>
      {[1, 2, 3].map((step) => (
        <span
          className={styles.stepDot}
          data-active={step === current}
          data-done={step < current}
          key={step}
        />
      ))}
      <span>Paso {current} de 3</span>
    </p>
  );
}

export function WelcomeStep() {
  const [state, action] = useActionState(startOnboardingAction, emptyOnboardingState);

  return (
    <div className={styles.card}>
      <form action={action} className={styles.form}>
        {state.status === "error" ? (
          <p className={styles.error} role="alert">
            {state.message}
          </p>
        ) : null}
        <p className={styles.notice}>
          Doleth te ayuda a entender cuánto tenés, qué cambió y qué viene después.
        </p>
        <p className={styles.hint}>
          Vamos a configurar tu moneda y tu zona horaria, y después vas a cargar tu primera cuenta con el saldo que
          tenés hoy. No inventamos ningún dato por vos.
        </p>
        <AuthSubmit pendingLabel="Preparando…">Empezar</AuthSubmit>
      </form>
    </div>
  );
}

export function PreferencesStep({
  defaults,
}: {
  defaults: { primaryCurrency: string; timeZone: string; locale: string };
}) {
  const [state, action] = useActionState(savePreferencesAction, emptyOnboardingState);

  return (
    <div className={styles.card}>
      <form action={action} className={styles.form} noValidate>
        {state.status === "error" && state.message ? (
          <p className={styles.error} role="alert" tabIndex={-1}>
            {state.message}
          </p>
        ) : null}

        <div className={styles.field}>
          <label htmlFor="primaryCurrency">Moneda principal</label>
          <select defaultValue={defaults.primaryCurrency} id="primaryCurrency" name="primaryCurrency" required>
            {currencyOptions.map((currency) => (
              <option key={currency} value={currency}>
                {currency} · peso argentino
              </option>
            ))}
          </select>
          {state.errors.primaryCurrency ? (
            <span className={styles.fieldError}>{state.errors.primaryCurrency}</span>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="timeZone">Zona horaria</label>
          <select defaultValue={defaults.timeZone} id="timeZone" name="timeZone" required>
            {timeZoneOptions.map((zone) => (
              <option key={zone} value={zone}>
                {TIME_ZONE_LABELS[zone] ?? zone}
              </option>
            ))}
          </select>
          {state.errors.timeZone ? <span className={styles.fieldError}>{state.errors.timeZone}</span> : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="locale">Formato regional</label>
          <select defaultValue={defaults.locale} id="locale" name="locale" required>
            {localeOptions.map((locale) => (
              <option key={locale} value={locale}>
                {LOCALE_LABELS[locale] ?? locale}
              </option>
            ))}
          </select>
          {state.errors.locale ? <span className={styles.fieldError}>{state.errors.locale}</span> : null}
        </div>

        <AuthSubmit pendingLabel="Guardando…">Continuar</AuthSubmit>
      </form>
    </div>
  );
}

export function FirstAccountStep({ currency, today }: { currency: string; today: string }) {
  const [state, action] = useActionState(createFirstAccountAction, emptyOnboardingState);

  return (
    <div className={styles.card}>
      <form action={action} className={styles.form} noValidate>
        {state.status === "error" && state.message ? (
          <p className={styles.error} role="alert" tabIndex={-1}>
            {state.message}
          </p>
        ) : null}

        <TextField
          autoComplete="off"
          autoFocus
          error={state.errors.name}
          label="Nombre de la cuenta"
          maxLength={60}
          name="name"
          placeholder="Cuenta principal"
          required
        />

        <div className={styles.field}>
          <label htmlFor="type">Tipo</label>
          <select defaultValue="BANK" id="type" name="type" required>
            {ACCOUNT_TYPES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {state.errors.type ? <span className={styles.fieldError}>{state.errors.type}</span> : null}
        </div>

        <TextField
          error={state.errors.initialBalance}
          hint="El saldo real que tenés hoy en esa cuenta. Después sólo cambia con movimientos."
          inputMode="decimal"
          label={`Saldo inicial (${currency})`}
          name="initialBalance"
          placeholder="0,00"
          required
        />
        <input name="currency" type="hidden" value={currency} />

        <TextField
          defaultValue={today}
          error={state.errors.balanceDate}
          hint="Fecha a la que corresponde ese saldo."
          label="Fecha del saldo inicial"
          name="balanceDate"
          type="date"
        />

        <AuthSubmit pendingLabel="Creando tu cuenta…">Crear cuenta y terminar</AuthSubmit>
      </form>
    </div>
  );
}
