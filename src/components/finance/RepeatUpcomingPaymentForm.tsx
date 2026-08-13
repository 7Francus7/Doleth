"use client";

import Link from "next/link";
import { useActionState } from "react";
import { repeatUpcomingPaymentAction, type FinanceActionState } from "../../app/actions/finance";
import { SubmitButton } from "./SubmitButton";
import { StatusMessage } from "../../design-system/feedback";
import styles from "../../features/plan/planPaymentForm.module.css";

const initialState: FinanceActionState = { ok: false, message: "" };

/**
 * Crear el mismo pago para el mes siguiente.
 *
 * No es un motor de recurrencia: crea un único pago previsto más, con la misma
 * cuenta e importe, y sigue necesitando confirmación humana cuando se pague.
 */
export function RepeatUpcomingPaymentForm({
  paymentId,
  nextDueLabel,
}: {
  paymentId: string;
  nextDueLabel: string;
}) {
  const [state, action] = useActionState(repeatUpcomingPaymentAction, initialState);

  return (
    <form action={action} className={styles.repeatForm}>
      <input name="paymentId" type="hidden" value={paymentId} />
      <p className={styles.fieldHelp}>
        Se va a crear otro pago previsto para el {nextDueLabel}, con el mismo importe y la misma
        cuenta. No se convierte en gasto por su cuenta.
      </p>
      {state.message ? (
        <StatusMessage tone={state.ok ? "success" : "error"}>
          {state.detail ? `${state.message} ${state.detail}` : state.message}
        </StatusMessage>
      ) : null}
      {state.ok && state.data?.redirectTo ? (
        <Link className={styles.quietLink} href={state.data.redirectTo}>
          Ver el pago creado
        </Link>
      ) : (
        <SubmitButton pendingLabel="Creando…">Crear otro para el próximo mes</SubmitButton>
      )}
    </form>
  );
}
