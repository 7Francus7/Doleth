"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { payUpcomingPaymentAction, type FinanceActionState } from "../../app/actions/finance";
import { SubmitButton } from "./SubmitButton";
import { AmountInput } from "../../design-system/primitives/AmountInput";
import { StatusMessage } from "../../design-system/feedback";
import { SensitiveAmount } from "../privacy/AmountPrivacy";
import { formatCentsAR, parseAmountInput } from "../../lib/finance/amount";
import styles from "../../features/plan/planPaymentForm.module.css";

const initialState: FinanceActionState = { ok: false, message: "" };

export function PaymentConfirmationFeedback({ concept, amount, currency, transactionId, returnTo, detail }: {
  concept: string; amount: string; currency: string; transactionId?: string; returnTo: string; detail?: string;
}) {
  const moneyPrefix = currency === "ARS" ? "$" : `${currency} `;
  return <section aria-live="polite" className={styles.success}>
    <p>Pago registrado</p>
    <h2>{concept} · <SensitiveAmount>{moneyPrefix}{amount}</SensitiveAmount></h2>
    {detail ? <span>{detail}</span> : null}
    <div>{transactionId ? <Link className={styles.primaryLink} href={`/movimientos/${transactionId}`}>Ver movimiento</Link> : null}<Link className={styles.quietLink} href={returnTo}>Volver a Plan</Link></div>
  </section>;
}

export interface ConfirmPaymentFormProps {
  paymentId: string;
  concept: string;
  today: string;
  /** Importe previsto, en formato argentino, para prellenar el campo. */
  plannedAmount: string;
  accountName: string;
  currency: string;
  /** Saldo actual de la cuenta prevista, en centavos. */
  accountBalanceCents: string;
  /** Categorías de gasto disponibles para clasificar el movimiento que nace acá. */
  categories?: { id: string; name: string; kind: string }[];
  /** La que se eligió al prever el pago, si se eligió alguna. */
  categoryId?: string | null;
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
  currency,
  accountBalanceCents,
  categories = [],
  categoryId = null,
  returnTo,
}: ConfirmPaymentFormProps) {
  const expenseCategories = categories.filter((category) => category.kind === "EXPENSE");
  const [state, action] = useActionState(payUpcomingPaymentAction, initialState);
  const [amount, setAmount] = useState(plannedAmount);
  const [occurredOn, setOccurredOn] = useState(today);

  const reading = parseAmountInput(amount);
  const plannedReading = parseAmountInput(plannedAmount);
  const balanceCents = BigInt(accountBalanceCents);
  const afterCents = reading.cents === null ? null : balanceCents - reading.cents;
  const changedAmount = reading.cents !== null && reading.cents !== plannedReading.cents;
  const moneyPrefix = currency === "ARS" ? "$" : `${currency} `;

  if (state.ok) {
    return <PaymentConfirmationFeedback amount={state.data?.amount ?? plannedAmount} concept={concept} currency={currency} returnTo={returnTo} {...(state.detail ? { detail: state.detail } : {})} {...(state.data?.transactionId ? { transactionId: state.data.transactionId } : {})} />;
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
            <dd><SensitiveAmount>{balanceCents < 0n ? "−" : ""}{moneyPrefix}{formatCentsAR(balanceCents < 0n ? -balanceCents : balanceCents)}</SensitiveAmount></dd>
          </div>
          <div className={styles.detailRow}>
            <dt>Saldo después de pagar</dt>
            <dd><SensitiveAmount sensitive={afterCents !== null}>
              {afterCents === null
                ? "—"
                : afterCents < 0n
                  ? `Faltarían ${moneyPrefix}${formatCentsAR(-afterCents)}`
                  : `${moneyPrefix}${formatCentsAR(afterCents)}`}
            </SensitiveAmount></dd>
          </div>
        </dl>
      </div>

      <AmountInput
        hint={`Habías previsto ${moneyPrefix}${plannedAmount}. Si salió otro importe, corregilo acá.`}
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

      {/*
        La categoría se puede elegir o cambiar acá porque éste es el momento en
        que el gasto existe. Un pago previsto cargado en el onboarding, o antes
        de que el formulario preguntara la categoría, encuentra su lugar sin
        tener que corregir el movimiento después.
      */}
      {expenseCategories.length ? (
        <label className={styles.field}>
          <span>Categoría del gasto</span>
          <select defaultValue={categoryId ?? ""} name="categoryId">
            <option value="">Sin elegir · irá a Otros gastos</option>
            {expenseCategories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
      ) : null}

      {state.message && !state.ok ? <StatusMessage tone="error">{state.message}</StatusMessage> : null}

      <SubmitButton disabled={reading.cents === null} pendingLabel="Confirmando…">
        Confirmar pago
      </SubmitButton>
    </form>
  );
}
