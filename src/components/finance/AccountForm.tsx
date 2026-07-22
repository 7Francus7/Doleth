"use client";

import { useActionState, useEffect, useRef } from "react";
import { createAccountAction, type FinanceActionState } from "../../app/actions/finance";
import { SubmitButton } from "./SubmitButton";
import styles from "./finance.module.css";

const initialState: FinanceActionState = { ok: false, message: "" };

export function AccountForm() {
  const [state, action] = useActionState(createAccountAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) formRef.current?.reset(); }, [state.ok]);

  return (
    <form action={action} className={styles.form} ref={formRef}>
      <label className={styles.field}>
        <span>Nombre</span>
        <input autoComplete="off" maxLength={60} name="name" placeholder="Cuenta principal" required />
      </label>
      <label className={styles.field}>
        <span>Tipo</span>
        <select defaultValue="BANK" name="type" required>
          <option value="CASH">Efectivo</option><option value="BANK">Banco</option>
          <option value="WALLET">Billetera virtual</option><option value="SAVINGS">Ahorro</option>
          <option value="OTHER">Otra</option>
        </select>
      </label>
      <div className={styles.fieldRow}>
        <label className={styles.field}>
          <span>Saldo inicial</span>
          <input inputMode="decimal" name="initialBalance" placeholder="0,00" required />
        </label>
        <label className={styles.field}>
          <span>Moneda</span>
          <input defaultValue="ARS" maxLength={3} name="currency" readOnly required />
        </label>
      </div>
      {state.message ? <p className={state.ok ? styles.success : styles.error} role="status">{state.message}</p> : null}
      <SubmitButton>Crear cuenta</SubmitButton>
    </form>
  );
}
