"use client";

import { useActionState, useEffect, useRef } from "react";
import { createInvestmentAction, type FinanceActionState } from "../../app/actions/finance";
import { StatusMessage } from "../../design-system/feedback";
import styles from "../../features/patrimony/investmentForm.module.css";
import { SubmitButton } from "./SubmitButton";

const initialState: FinanceActionState = { ok: false, message: "" };

export function InvestmentForm() {
  const [state, action] = useActionState(createInvestmentAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) formRef.current?.reset(); }, [state.ok]);

  return (
    <form action={action} className={styles.form} ref={formRef}>
      <div className={styles.primaryFields}>
        <label className={styles.field}>
          <span>Tipo</span>
          <select defaultValue="STOCKS" name="kind" required>
            <option value="STOCKS">Acciones / CEDEARs</option><option value="CRYPTO">Cripto</option>
            <option value="FUND">Fondos (FCI)</option><option value="BOND">Bonos</option>
            <option value="REAL_ESTATE">Inmuebles</option><option value="CASH_EQUIVALENT">Liquidez</option>
            <option value="OTHER">Otras</option>
          </select>
        </label>
        <label className={styles.field}>
          <span>Activo</span>
          <input autoComplete="off" maxLength={80} name="name" placeholder="CEDEAR AAPL" required />
        </label>
        <label className={styles.field}>
          <span>Moneda</span>
          <select defaultValue="ARS" name="currency" required>
            <option value="ARS">ARS · pesos</option><option value="USD">USD · dólares</option>
          </select>
        </label>
        <div className={styles.amounts}>
          <label className={`${styles.field} ${styles.amountField}`}>
            <span>Monto aportado</span>
            <input inputMode="decimal" name="invested" placeholder="0,00" required />
          </label>
          <label className={`${styles.field} ${styles.amountField}`}>
            <span>Valor actual</span>
            <input inputMode="decimal" name="currentValue" placeholder="0,00" required />
          </label>
        </div>
      </div>
      <details className={styles.details}>
        <summary>+ VALUACIÓN POR COTIZACIÓN</summary>
        <div className={styles.detailFields}>
          <p>Si completás símbolo y cantidad, el último precio disponible reemplaza el valor actual declarado.</p>
          <label className={styles.field}>
            <span>Símbolo</span>
            <input autoCapitalize="characters" autoComplete="off" maxLength={20} name="symbol" placeholder="AAPL" />
          </label>
          <label className={styles.field}>
            <span>Cantidad</span>
            <input autoComplete="off" inputMode="decimal" name="quantity" placeholder="12" />
          </label>
        </div>
      </details>
      <details className={styles.details}>
        <summary>+ NOTA</summary>
        <div className={styles.detailFields}>
          <label className={styles.field}>
            <span>Nota opcional</span>
            <input autoComplete="off" maxLength={160} name="note" placeholder="Broker, objetivo, etc." />
          </label>
        </div>
      </details>
      {state.message ? <StatusMessage tone={state.ok ? "success" : "error"}>{state.message}</StatusMessage> : null}
      <div className={styles.submit}><SubmitButton pendingLabel="Registrando…">Registrar inversión</SubmitButton></div>
    </form>
  );
}
