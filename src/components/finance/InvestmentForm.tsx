"use client";

import { useActionState, useEffect, useRef } from "react";
import { createInvestmentAction, type FinanceActionState } from "../../app/actions/finance";
import { SubmitButton } from "./SubmitButton";
import styles from "./finance.module.css";

const initialState: FinanceActionState = { ok: false, message: "" };

export function InvestmentForm() {
  const [state, action] = useActionState(createInvestmentAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) formRef.current?.reset(); }, [state.ok]);

  return (
    <form action={action} className={styles.form} ref={formRef}>
      <label className={styles.field}>
        <span>Nombre</span>
        <input autoComplete="off" maxLength={80} name="name" placeholder="CEDEAR AAPL" required />
      </label>
      <div className={styles.fieldRow}>
        <label className={styles.field}>
          <span>Tipo</span>
          <select defaultValue="STOCKS" name="kind" required>
            <option value="STOCKS">Acciones / CEDEARs</option>
            <option value="CRYPTO">Cripto</option>
            <option value="FUND">Fondos (FCI)</option>
            <option value="BOND">Bonos</option>
            <option value="REAL_ESTATE">Inmuebles</option>
            <option value="CASH_EQUIVALENT">Liquidez</option>
            <option value="OTHER">Otras</option>
          </select>
        </label>
        <label className={styles.field}>
          <span>Símbolo (opcional)</span>
          <input autoComplete="off" maxLength={20} name="symbol" placeholder="AAPL" />
        </label>
      </div>
      <div className={styles.fieldRow}>
        <label className={styles.field}>
          <span>Monto aportado</span>
          <input inputMode="decimal" name="invested" placeholder="0,00" required />
        </label>
        <label className={styles.field}>
          <span>Valor actual</span>
          <input inputMode="decimal" name="currentValue" placeholder="0,00" required />
        </label>
      </div>
      <label className={styles.field}>
        <span>Nota (opcional)</span>
        <input autoComplete="off" maxLength={160} name="note" placeholder="Broker, objetivo, etc." />
      </label>
      <input name="currency" type="hidden" value="ARS" />
      {state.message ? <p className={state.ok ? styles.success : styles.error} role="status">{state.message}</p> : null}
      <SubmitButton>Registrar inversión</SubmitButton>
    </form>
  );
}
