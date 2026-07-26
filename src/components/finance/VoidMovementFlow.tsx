"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { voidMovementAction, type FinanceActionState } from "../../app/actions/finance";
import { ConfirmDialog } from "../../design-system/composites/ConfirmDialog";
import { Button } from "../../design-system/primitives/Button";
import { StatusMessage } from "../../design-system/feedback";
import { SensitiveAmount } from "../privacy/AmountPrivacy";
import styles from "./finance.module.css";

const initialState: FinanceActionState = { ok: false, message: "" };

function VoidSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button kind="primary" loading={pending} loadingLabel="Anulando…" size="lg" type="submit" width="fill">
      Anular movimiento
    </Button>
  );
}

export interface VoidMovementFlowProps {
  movementId: string;
  /** Datos reales que se muestran antes de decidir. */
  summary: { typeLabel: string; amount: string; accountName: string; date: string };
  returnTo: string;
}

export function VoidMovementFlow({ movementId, summary, returnTo }: VoidMovementFlowProps) {
  const [state, action] = useActionState(voidMovementAction, initialState);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  if (state.ok) {
    return (
      <StatusMessage tone="success">
        {state.message} {state.detail}
      </StatusMessage>
    );
  }

  return (
    <>
      <Button kind="secondary" onClick={() => setOpen(true)} ref={triggerRef} size="lg" type="button">
        Anular movimiento
      </Button>
      <ConfirmDialog
        description="Dejará de afectar tus saldos, pero continuará en el historial."
        onOpenChange={setOpen}
        open={open}
        returnFocusRef={triggerRef}
        title="¿Anular este movimiento?"
      >
        <dl className={styles.detailGrid}>
          <div className={styles.detailRow}><dt>Tipo</dt><dd>{summary.typeLabel}</dd></div>
          <div className={styles.detailRow}><dt>Importe</dt><dd><SensitiveAmount>${summary.amount}</SensitiveAmount></dd></div>
          <div className={styles.detailRow}><dt>Cuenta</dt><dd>{summary.accountName}</dd></div>
          <div className={styles.detailRow}><dt>Fecha</dt><dd>{summary.date}</dd></div>
          <div className={styles.detailRow}><dt>Estado</dt><dd>Confirmado</dd></div>
        </dl>
        <form action={action} className={styles.voidForm}>
          <input name="id" type="hidden" value={movementId} />
          <input name="volver" type="hidden" value={returnTo} />
          <label className={styles.field}>
            <span>Motivo de la anulación</span>
            <input
              aria-describedby="void-reason-help"
              maxLength={160}
              minLength={4}
              name="reason"
              placeholder="Por qué deja de valer"
              required
            />
          </label>
          <p className={styles.fieldHelp} id="void-reason-help">Queda registrado en el historial junto al movimiento.</p>
          {state.message && !state.ok ? <StatusMessage tone="error">{state.message}</StatusMessage> : null}
          <div className={styles.voidActions}>
            <Button kind="secondary" onClick={() => setOpen(false)} size="lg" type="button">Volver</Button>
            <VoidSubmit />
          </div>
        </form>
      </ConfirmDialog>
    </>
  );
}
