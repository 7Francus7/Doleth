"use client";

import { useActionState } from "react";
import { payUpcomingPaymentAction, type FinanceActionState } from "../../app/actions/finance";
import { SubmitButton } from "./SubmitButton";
import { StatusMessage } from "../../design-system/feedback";
import styles from "./finance.module.css";

const initialState: FinanceActionState = { ok: false, message: "" };

export function PayUpcomingPaymentForm({ paymentId, today }: { paymentId: string; today: string }) {
  const [state, action] = useActionState(payUpcomingPaymentAction, initialState);
  return (
    <form action={action} className={styles.dangerForm}>
      <input name="paymentId" type="hidden" value={paymentId} />
      <label className={styles.field}><span>Fecha real del pago</span><input defaultValue={today} name="occurredOn" required type="date" /></label>
      {state.message ? <StatusMessage tone={state.ok ? "success" : "error"}>{state.message}</StatusMessage> : null}
      <SubmitButton pendingLabel="Convirtiendo…">Marcar pagado y crear gasto</SubmitButton>
    </form>
  );
}
