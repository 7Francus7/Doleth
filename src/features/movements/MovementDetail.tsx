import type { ReactNode } from "react";
import { SensitiveAmount } from "../../components/privacy/AmountPrivacy";
import { movementTypeLabel, signedMovementAmount, type MovementType } from "./model";
import styles from "./movements.module.css";

export interface MovementDetailModel {
  type: MovementType; amount: string; currency: string; date: string;
  description?: string | null; category?: string | null; sourceAccount: string;
  destinationAccount?: string | null; destinationAmount?: string | null;
  voided: boolean; voidReason?: string | null; correctedFrom?: ReactNode; correction?: ReactNode;
}

export function MovementDetail({ movement, actions, danger }: { movement: MovementDetailModel; actions?: ReactNode; danger?: ReactNode }) {
  return <article className={styles.detail} data-type={movement.type}>
    <header className={styles.detailHero}>
      <div><p>{movementTypeLabel[movement.type]}</p><strong><SensitiveAmount>{signedMovementAmount(movement)}</SensitiveAmount></strong></div>
      <span>{movement.voided ? "Anulado" : movement.correction ? "Corregido" : "Confirmado"}</span>
    </header>
    <dl className={styles.detailFacts}>
      <div><dt>Fecha</dt><dd>{movement.date}</dd></div>
      {movement.description ? <div><dt>Descripción</dt><dd>{movement.description}</dd></div> : null}
      {movement.category ? <div><dt>Categoría</dt><dd>{movement.category}</dd></div> : null}
      <div><dt>{movement.type === "TRANSFER" ? "Sale de" : "Cuenta"}</dt><dd>{movement.sourceAccount}</dd></div>
      {movement.destinationAccount ? <div><dt>Entra en</dt><dd>{movement.destinationAccount}</dd></div> : null}
      {movement.destinationAmount ? <div><dt>Importe acreditado</dt><dd>{movement.destinationAmount}</dd></div> : null}
      {movement.voided ? <div><dt>Estado</dt><dd>Anulado{movement.voidReason ? ` · ${movement.voidReason}` : ""}</dd></div> : null}
      {movement.correction ? <div><dt>Corrección</dt><dd>{movement.correction}</dd></div> : null}
      {movement.correctedFrom ? <div><dt>Reemplaza</dt><dd>{movement.correctedFrom}</dd></div> : null}
    </dl>
    {actions ? <nav aria-label="Acciones del movimiento" className={styles.detailActions}>{actions}</nav> : null}
    {danger ? <div className={styles.detailDanger}>{danger}</div> : null}
  </article>;
}
