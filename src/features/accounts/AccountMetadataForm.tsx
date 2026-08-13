"use client";

import { useActionState } from "react";
import { updateAccountMetadataAction, type FinanceActionState } from "../../app/actions/finance";
import { StatusMessage } from "../../design-system/feedback";
import { SubmitButton } from "../../components/finance/SubmitButton";
import styles from "./accountForm.module.css";

const initialState: FinanceActionState = { ok: false, message: "" };

export function AccountMetadataForm({ account }: { account: { id: string; name: string; typeLabel: string; currency: string; creditCard?: { brand: string | null; last4: string | null; closingDay: number; dueDay: number } | null } }) {
  const [state, action] = useActionState(updateAccountMetadataAction, initialState);
  return <form action={action} className={styles.metadataForm}>
    <input name="id" type="hidden" value={account.id} />
    <label><span>Nombre</span><input autoComplete="off" defaultValue={account.name} maxLength={60} name="name" required /></label>
    <div className={styles.lockedFacts}><div><span>Tipo</span><strong>{account.typeLabel}</strong></div><div><span>Moneda</span><strong>{account.currency}</strong></div><p>Tipo, moneda y saldo inicial están bloqueados: cambiarlos reinterpretaría movimientos existentes.</p></div>
    {account.creditCard ? <fieldset><legend>Datos de tarjeta</legend><label><span>Marca</span><input autoComplete="off" defaultValue={account.creditCard.brand ?? ""} maxLength={40} name="brand" /></label><label><span>Últimos 4</span><input autoComplete="off" defaultValue={account.creditCard.last4 ?? ""} inputMode="numeric" maxLength={4} name="last4" /></label><label><span>Día de cierre</span><input defaultValue={account.creditCard.closingDay} inputMode="numeric" max={31} min={1} name="closingDay" required type="number" /></label><label><span>Día de vencimiento</span><input defaultValue={account.creditCard.dueDay} inputMode="numeric" max={31} min={1} name="dueDay" required type="number" /></label></fieldset> : null}
    {state.message ? <StatusMessage tone={state.ok ? "success" : "error"}>{state.message}</StatusMessage> : null}
    <SubmitButton pendingLabel="Guardando…">Guardar cambios</SubmitButton>
  </form>;
}
