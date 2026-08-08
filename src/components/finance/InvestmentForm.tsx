"use client";

import { useActionState, useEffect, useRef } from "react";
import { createInvestmentAction, type FinanceActionState } from "../../app/actions/finance";
import { SubmitButton } from "./SubmitButton";
import { StatusMessage } from "../../design-system/feedback";
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
          <span>Cantidad (opcional)</span>
          <input autoComplete="off" inputMode="decimal" name="quantity" placeholder="12" />
        </label>
        <label className={styles.field}>
          <span>Monto aportado</span>
          <input inputMode="decimal" name="invested" placeholder="0,00" required />
        </label>
      </div>
      <p className={styles.fieldHint}>
        Si cargás la cantidad y el símbolo, el valor se calcula solo con el último precio conocido y no tenés que
        actualizarlo a mano. Para un inmueble o algo sin cotización, dejá la cantidad vacía.
      </p>
      <label className={styles.field}>
        <span>Valor actual</span>
        <input inputMode="decimal" name="currentValue" placeholder="0,00" required />
      </label>
      <p className={styles.fieldHint}>
        Se usa mientras no haya precio para el símbolo. Con precio disponible, manda el cálculo por cantidad.
      </p>
      <label className={styles.field}>
        <span>Nota (opcional)</span>
        <input autoComplete="off" maxLength={160} name="note" placeholder="Broker, objetivo, etc." />
      </label>
            <label className={styles.field}>
        <span>Moneda</span>
        <select defaultValue="ARS" name="currency" required>
          <option value="ARS">ARS · pesos</option>
          <option value="USD">USD · dólares</option>
        </select>
      </label>
      {state.message ? <StatusMessage tone={state.ok ? "success" : "error"}>{state.message}</StatusMessage> : null}
      <SubmitButton pendingLabel="Registrando…">Registrar inversión</SubmitButton>
    </form>
  );
}
