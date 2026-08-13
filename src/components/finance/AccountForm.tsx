"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createAccountAction, type FinanceActionState } from "../../app/actions/finance";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_HINTS, ACCOUNT_TYPE_LABELS, isLiabilityAccount } from "../../lib/finance/accountKind";
import { CURRENCY_LABELS, SUPPORTED_CURRENCIES } from "../../lib/finance/currency";
import { SubmitButton } from "./SubmitButton";
import { StatusMessage } from "../../design-system/feedback";
import styles from "../../features/accounts/accountForm.module.css";

const initialState: FinanceActionState = { ok: false, message: "" };

export function AccountForm() {
  const [state, action] = useActionState(createAccountAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState("BANK");
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  const liability = isLiabilityAccount(type);
  const hint = ACCOUNT_TYPE_HINTS[type as "CREDIT_CARD"];

  return (
    // `onReset` y no un efecto: `form.reset()` dispara este evento, así que el
    // tipo vuelve a su valor inicial dentro del manejador que ya está corriendo
    // en vez de encadenar un render extra.
    <form action={action} className={styles.createForm} data-liability={liability || undefined} onReset={() => setType("BANK")} ref={formRef}>
      <label className={styles.field}>
        <span>Nombre</span>
        <input
          autoComplete="off"
          maxLength={60}
          name="name"
          placeholder={liability ? "Visa Galicia" : "Cuenta principal"}
          required
        />
      </label>
      <label className={styles.field}>
        <span>Tipo</span>
        <select name="type" onChange={(event) => setType(event.target.value)} required value={type}>
          {ACCOUNT_TYPES.map((kind) => (
            <option key={kind} value={kind}>
              {ACCOUNT_TYPE_LABELS[kind]}
            </option>
          ))}
        </select>
      </label>
      {/*
        Una tarjeta necesita explicación y una caja de efectivo no: su saldo
        negativo es lo normal, y en cualquier otra cuenta sería un problema. Sin
        decirlo, la misma señal visual significaría dos cosas opuestas.
      */}
      {hint ? <p className={styles.fieldHint}>{hint}</p> : null}

      <div className={styles.accountBasics}>
        <label className={`${styles.field} ${styles.amountField}`}>
          <span>{liability ? "Deuda actual" : "Saldo inicial"}</span>
          <input inputMode="decimal" name="initialBalance" placeholder="0,00" required />
        </label>
        <label className={styles.field}>
          <span>Moneda</span>
          <select defaultValue="ARS" name="currency" required>
            {SUPPORTED_CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency} · {CURRENCY_LABELS[currency]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {liability ? (
        <p className={styles.fieldHint}>
          Escribí la deuda con signo menos, por ejemplo -240.000. Es lo que debés hoy en esta tarjeta.
        </p>
      ) : null}

      {liability ? (
        <div className={styles.fieldRow}>
          <label className={styles.field}>
            <span>Día de cierre</span>
            <input inputMode="numeric" max={31} min={1} name="closingDay" placeholder="20" required type="number" />
          </label>
          <label className={styles.field}>
            <span>Día de vencimiento</span>
            <input inputMode="numeric" max={31} min={1} name="dueDay" placeholder="10" required type="number" />
          </label>
        </div>
      ) : null}
      {liability ? (
        <label className={styles.field}>
          <span>Últimos 4 dígitos (opcional)</span>
          <input autoComplete="off" inputMode="numeric" maxLength={4} name="last4" placeholder="4321" />
        </label>
      ) : null}

      {state.message ? <StatusMessage tone={state.ok ? "success" : "error"}>{state.message}</StatusMessage> : null}
      <SubmitButton pendingLabel="Creando cuenta…">{liability ? "Crear tarjeta" : "Crear cuenta"}</SubmitButton>
    </form>
  );
}
