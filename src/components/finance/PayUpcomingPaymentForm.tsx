"use client";

import { useActionState } from "react";
import { payUpcomingPaymentAction, type FinanceActionState } from "../../app/actions/finance";
import { SubmitButton } from "./SubmitButton";
import styles from "./finance.module.css";

const initialState: FinanceActionState = { ok: false, message: "" };

export function PayUpcomingPaymentForm({ paymentId, today }: { paymentId: string; today: string }) {
  const [state, action] = useActionState(payUpcomingPaymentAction, initialState);
  return (
    <form action={action} className={styles.dangerForm}>
      <input name="paymentId" type="hidden" value={paymentId} />
      <label className={styles.field}><span>Fecha real del pago</span><input defaultValue={today} name="occurredOn" required type="date" /></label>
      {state.message ? <p className={state.ok ? styles.success : styles.error} role="status">{state.message}</p> : null}
      <SubmitButton pendingLabel="Convirtiendo…">Marcar pagado y crear gasto</SubmitButton>
    </form>
  );
}
