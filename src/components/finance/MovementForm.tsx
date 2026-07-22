"use client";

import { useActionState, useState } from "react";
import {
  correctMovementAction,
  createMovementAction,
  type FinanceActionState,
} from "../../app/actions/finance";
import { SubmitButton } from "./SubmitButton";
import styles from "./finance.module.css";

interface Option { id: string; name: string; currency?: string; kind?: string }
interface MovementDefaults {
  id: string;
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  amount: string;
  occurredOn: string;
  sourceAccountId: string;
  destinationAccountId?: string;
  categoryId?: string;
  description?: string;
}

const initialState: FinanceActionState = { ok: false, message: "" };

export function MovementForm({
  accounts,
  categories,
  today,
  defaults,
  idempotencyKey,
}: {
  accounts: Option[];
  categories: Option[];
  today: string;
  defaults?: MovementDefaults;
  idempotencyKey: string;
}) {
  const handler = defaults ? correctMovementAction : createMovementAction;
  const [state, action] = useActionState(handler, initialState);
  const [type, setType] = useState<MovementDefaults["type"]>(defaults?.type ?? "EXPENSE");

  const visibleCategories = categories.filter((category) => category.kind === type);

  return (
    <form action={action} className={`${styles.form} ${styles.movementForm}`}>
      {defaults ? <input name="originalId" type="hidden" value={defaults.id} /> : null}
      <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
      <label className={`${styles.field} ${styles.amountField}`}>
        <span>Importe</span>
        <input autoFocus inputMode="decimal" name="amount" placeholder="0,00" defaultValue={defaults?.amount} required />
      </label>
      <fieldset className={styles.segmented}>
        <legend>Tipo</legend>
        {(["EXPENSE", "INCOME", "TRANSFER"] as const).map((option) => (
          <label key={option}>
            <input checked={type === option} name="type" onChange={() => setType(option)} type="radio" value={option} />
            <span>{option === "EXPENSE" ? "Gasto" : option === "INCOME" ? "Ingreso" : "Transferencia"}</span>
          </label>
        ))}
      </fieldset>
      <label className={styles.field}>
        <span>{type === "TRANSFER" ? "Cuenta de origen" : "Cuenta"}</span>
        <select defaultValue={defaults?.sourceAccountId ?? ""} name="sourceAccountId" required>
          <option disabled value="">Seleccionar cuenta</option>
          {accounts.map((account) => <option key={account.id} value={account.id}>{account.name} · {account.currency}</option>)}
        </select>
      </label>
      {type === "TRANSFER" ? (
        <label className={styles.field}>
          <span>Cuenta de destino</span>
          <select defaultValue={defaults?.destinationAccountId ?? ""} name="destinationAccountId" required>
            <option disabled value="">Seleccionar destino</option>
            {accounts.map((account) => <option key={account.id} value={account.id}>{account.name} · {account.currency}</option>)}
          </select>
        </label>
      ) : (
        <label className={styles.field}>
          <span>Categoría</span>
          <select defaultValue={defaults?.categoryId ?? ""} key={type} name="categoryId" required>
            <option disabled value="">Seleccionar categoría</option>
            {visibleCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
      )}
      <label className={styles.field}>
        <span>Fecha</span>
        <input defaultValue={defaults?.occurredOn ?? today} name="occurredOn" required type="date" />
      </label>
      <label className={styles.field}>
        <span>Descripción <small>opcional</small></span>
        <input defaultValue={defaults?.description} maxLength={160} name="description" placeholder="Detalle breve" />
      </label>
      {state.message ? <p className={state.ok ? styles.success : styles.error} role="status">{state.message}</p> : null}
      <div className={styles.movementSubmit}>
        <SubmitButton pendingLabel="Registrando…">{defaults ? "Guardar corrección" : "Registrar movimiento"}</SubmitButton>
      </div>
    </form>
  );
}
