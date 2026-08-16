"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createUpcomingPaymentAction, type FinanceActionState } from "../../app/actions/finance";
import { SubmitButton } from "./SubmitButton";
import { AmountInput } from "../../design-system/primitives/AmountInput";
import { StatusMessage } from "../../design-system/feedback";
import styles from "./finance.module.css";

const initialState: FinanceActionState = { ok: false, message: "" };

/**
 * La categoría es opcional y dice qué pasa si no se elige.
 *
 * Obligarla agregaría un campo más a la carga rápida de un compromiso futuro,
 * que es justo cuando menos ganas hay de clasificar. Callarla era peor: el gasto
 * aparecía después en "Otros gastos" sin que nadie lo hubiera decidido.
 */
export function UpcomingPaymentForm({
  accounts,
  categories = [],
  today,
}: {
  accounts: { id: string; name: string }[];
  categories?: { id: string; name: string; kind: string }[];
  today: string;
}) {
  const expenseCategories = categories.filter((category) => category.kind === "EXPENSE");
  const [state, action] = useActionState(createUpcomingPaymentAction, initialState);
  const ref = useRef<HTMLFormElement>(null);
  // El importe usa el mismo campo que el resto del producto: acepta "45.000"
  // como lo escribe cualquiera acá y manda centavos exactos al servidor.
  const [amount, setAmount] = useState("");
  useEffect(() => { if (state.ok) ref.current?.reset(); }, [state.ok]);
  return (
    // `onReset` y no un efecto: `form.reset()` dispara este evento, así que el
    // importe se vacía dentro del manejador que ya está corriendo en vez de
    // encadenar un render extra.
    <form action={action} className={styles.form} onReset={() => setAmount("")} ref={ref}>
      <label className={styles.field}><span>Concepto</span><input maxLength={100} name="concept" placeholder="Pago de servicios" required /></label>
      <AmountInput
        label="Importe previsto"
        name="amount"
        onValueChange={setAmount}
        required
        value={amount}
        {...(state.error?.field === "amount" ? { error: state.message } : {})}
      />
      <label className={styles.field}><span>Vencimiento</span><input defaultValue={today} name="dueOn" required type="date" /></label>
      <label className={styles.field}><span>Cuenta prevista</span><select defaultValue="" name="plannedAccountId" required><option disabled value="">Seleccionar cuenta</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
      {expenseCategories.length ? (
        <label className={styles.field}>
          <span>Categoría <small>opcional</small></span>
          <select defaultValue="" name="categoryId">
            <option value="">Sin elegir · irá a Otros gastos</option>
            {expenseCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
      ) : null}
      <label className={styles.field}><span>Frecuencia <small>opcional</small></span><input maxLength={60} name="frequency" placeholder="Mensual" /></label>
      {state.message ? <StatusMessage tone={state.ok ? "success" : "error"}>{state.message}</StatusMessage> : null}
      <SubmitButton pendingLabel="Registrando…">Registrar próximo pago</SubmitButton>
    </form>
  );
}
