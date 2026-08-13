import Link from "next/link";
import type { ReactNode } from "react";
import { SensitiveAmount } from "../../components/privacy/AmountPrivacy";
import { formatDateAR } from "../../lib/finance/domain";
import { signedMovementAmount, type MovementType } from "../movements/model";
import styles from "./accounts.module.css";

export interface AccountDetailModel {
  id: string; name: string; typeLabel: string; currency: string; balance: string; status: "ACTIVE" | "ARCHIVED"; liability: boolean;
  creditCard?: { last4: string | null; brand: string | null; closingDay: number; dueDay: number } | null;
  recent: { id: string; type: MovementType; amount: string; currency: string; occurredOn: string; description: string; accountName: string; voided: boolean; corrected: boolean }[];
}

export function AccountDetail({ account, statusAction }: { account: AccountDetailModel; statusAction?: ReactNode }) {
  return <div className={styles.detail}>
    <section className={styles.detailHero} data-liability={account.liability || undefined}>
      <p>{account.liability ? "Deuda actual" : "Saldo actual"}</p>
      <strong><SensitiveAmount>{account.balance}</SensitiveAmount></strong>
      <span>{account.currency} · {account.typeLabel} · {account.status === "ACTIVE" ? "Activa" : "Archivada"}</span>
      {account.liability ? <small>Esta cuenta representa deuda. No forma parte de Disponible.</small> : null}
    </section>
    <section className={styles.detailFacts}>
      <dl><div><dt>Nombre</dt><dd>{account.name}</dd></div><div><dt>Moneda</dt><dd>{account.currency}</dd></div><div><dt>Tipo</dt><dd>{account.typeLabel}</dd></div><div><dt>Estado</dt><dd>{account.status === "ACTIVE" ? "Activa" : "Archivada"}</dd></div></dl>
      {account.creditCard ? <dl className={styles.cardFacts}><div><dt>Tarjeta</dt><dd>{account.creditCard.brand || "Crédito"}{account.creditCard.last4 ? ` · •••• ${account.creditCard.last4}` : ""}</dd></div><div><dt>Cierre</dt><dd>Día {account.creditCard.closingDay}</dd></div><div><dt>Vencimiento</dt><dd>Día {account.creditCard.dueDay}</dd></div></dl> : null}
      <div className={styles.detailActions}><Link href={`/movimientos?accountId=${account.id}`}>Ver todos los movimientos →</Link><Link href={`/cuentas/${account.id}/editar`}>Editar</Link>{statusAction}</div>
    </section>
    <section aria-labelledby="recent-title" className={styles.recent}><header><h2 id="recent-title">Últimos movimientos</h2><Link href={`/movimientos?accountId=${account.id}`}>Ver todos</Link></header>{account.recent.length ? account.recent.map((movement) => <Link href={`/movimientos/${movement.id}?volver=${encodeURIComponent(`/cuentas/${account.id}`)}`} key={movement.id}><span><strong>{movement.description}</strong><small>{formatDateAR(new Date(`${movement.occurredOn}T00:00:00.000Z`))} · {movement.accountName}</small></span><b><SensitiveAmount>{signedMovementAmount(movement)}</SensitiveAmount></b></Link>) : <p>No hay movimientos en esta cuenta.</p>}</section>
  </div>;
}
