"use client";

import { useActionState, useEffect, useRef } from "react";
import { createUpcomingPaymentAction, type FinanceActionState } from "../../app/actions/finance";
import { SubmitButton } from "./SubmitButton";
import styles from "./finance.module.css";

const initialState: FinanceActionState = { ok: false, message: "" };

export function UpcomingPaymentForm({ accounts, today }: { accounts: { id: string; name: string }[]; today: string }) {
  const [state, action] = useActionState(createUpcomingPaymentAction, initialState);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) ref.current?.reset(); }, [state.ok]);
  return (
    <form action={action} className={styles.form} ref={ref}>
      <label className={styles.field}><span>Concepto</span><input maxLength={100} name="concept" placeholder="Pago de servicios" required /></label>
      <label className={`${styles.field} ${styles.amountField}`}><span>Importe estimado</span><input inputMode="decimal" name="amount" placeholder="0,00" required /></label>
      <label className={styles.field}><span>Vencimiento</span><input defaultValue={today} name="dueOn" required type="date" /></label>
      <label className={styles.field}><span>Cuenta prevista</span><select defaultValue="" name="plannedAccountId" required><option disabled value="">Seleccionar cuenta</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
      <label className={styles.field}><span>Frecuencia <small>opcional</small></span><input maxLength={60} name="frequency" placeholder="Mensual" /></label>
      {state.message ? <p className={state.ok ? styles.success : styles.error} role="status">{state.message}</p> : null}
      <SubmitButton>Registrar próximo pago</SubmitButton>
    </form>
  );
}
