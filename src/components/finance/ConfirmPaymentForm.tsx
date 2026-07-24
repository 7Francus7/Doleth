"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { payUpcomingPaymentAction, type FinanceActionState } from "../../app/actions/finance";
import { SubmitButton } from "./SubmitButton";
import { AmountInput } from "../../design-system/primitives/AmountInput";
import { StatusMessage, SuccessState } from "../../design-system/feedback";
import { formatCentsAR, parseAmountInput } from "../../lib/finance/amount";
import styles from "./finance.module.css";

const initialState: FinanceActionState = { ok: false, message: "" };

export interface ConfirmPaymentFormProps {
  paymentId: string;
  concept: string;
  today: string;
  /** Importe previsto, en formato argentino, para prellenar el campo. */
  plannedAmount: string;
  accountName: string;
  /** Saldo actual de la cuenta prevista, en centavos. */
  accountBalanceCents: string;
  returnTo: string;
}

/**
 * Confirmación de un pago previsto.
 *
 * Antes de confirmar muestra qué va a pasar: importe, fecha, cuenta, saldo actual
 * y saldo posterior. El importe se puede ajustar porque lo cargado es un previsto,
 * no una factura: lo que se registra es lo que realmente salió.
 */
export function ConfirmPaymentForm({
  paymentId,
  concept,
  today,
  plannedAmount,
  accountName,
  accountBalanceCents,
  returnTo,
}: ConfirmPaymentFormProps) {
  const [state, action] = useActionState(payUpcomingPaymentAction, initialState);
  const [amount, setAmount] = useState(plannedAmount);
  const [occurredOn, setOccurredOn] = useState(today);

  const reading = parseAmountInput(amount);
  const balanceCents = BigInt(accountBalanceCents);
  const afterCents = reading.cents === null ? null : balanceCents - reading.cents;
  const changedAmount = reading.cents !== null && amount.trim() !== plannedAmount;

  if (state.ok) {
    return (
      <SuccessState
        description={state.detail ?? ""}
        title={state.message}
        {...(state.data?.amount ? { amount: state.data.amount } : {})}
        {...(state.data?.sourceAccountName ? { account: state.data.sourceAccountName } : {})}
        primaryAction={
          state.data?.transactionId ? (
            <Link className={styles.primaryLink} href={`/movimientos/${state.data.transactionId}`}>
              Ver movimiento
            </Link>
          ) : undefined
        }
        secondaryAction={
          <Link className={styles.quietLink} href={returnTo}>
            Volver a Próximo
          </Link>
        }
      />
    );
  }

  return (
    <form action={action} className={styles.form}>
      <input name="paymentId" type="hidden" value={paymentId} />
      <input name="volver" type="hidden" value={returnTo} />

      <div className={styles.confirmSummary}>
        <h2 className={styles.confirmTitle}>Vas a confirmar {concept}</h2>
        <dl className={styles.detailGrid}>
          <div className={styles.detailRow}>
            <dt>Cuenta</dt>
            <dd>{accountName}</dd>
          </div>
          <div className={styles.detailRow}>
            <dt>Saldo actual de la cuenta</dt>
            <dd>{balanceCents < 0n ? "-" : ""}${formatCentsAR(balanceCents < 0n ? -balanceCents : balanceCents)}</dd>
          </div>
          <div className={styles.detailRow}>
            <dt>Saldo después de pagar</dt>
            <dd>
              {afterCents === null
                ? "—"
                : afterCents < 0n
                  ? `Faltarían $${formatCentsAR(-afterCents)}`
                  : `$${formatCentsAR(afterCents)}`}
            </dd>
          </div>
        </dl>
      </div>

      <AmountInput
        hint={`Habías previsto $${plannedAmount}. Si salió otro importe, corregilo acá.`}
        label="Importe que salió"
        name="amount"
        onValueChange={setAmount}
        required
        value={amount}
        {...(state.error?.field === "amount" ? { error: state.message } : {})}
      />
      {changedAmount ? (
        <p className={styles.fieldHelp}>
          Se va a registrar el importe que escribiste. El previsto queda como referencia.
        </p>
      ) : null}

      <label className={styles.field}>
        <span>Fecha real del pago</span>
        <input
          max={today}
          name="occurredOn"
          onChange={(event) => setOccurredOn(event.target.value)}
          required
          type="date"
          value={occurredOn}
        />
      </label>

      {state.message && !state.ok ? <StatusMessage tone="error">{state.message}</StatusMessage> : null}

      <SubmitButton disabled={reading.cents === null} pendingLabel="Confirmando…">
        Confirmar pago
      </SubmitButton>
    </form>
  );
}
