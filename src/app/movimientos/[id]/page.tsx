import Link from "next/link";
import { notFound } from "next/navigation";
import { voidMovementAction } from "../../actions/finance";
import { OperationalShell } from "../../../components/finance/OperationalShell";
import { sanitizeReturnPath } from "../../../lib/navigation/returnPath";
import { getDb } from "../../../lib/db";
import { formatCents, formatDateAR } from "../../../lib/finance/domain";
import styles from "../../../components/finance/finance.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Movimiento" };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function MovementDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const backHref = sanitizeReturnPath(first((await searchParams).volver), "/movimientos");
  const movement = await getDb().transaction.findUnique({ where: { id }, include: { sourceAccount: true, destinationAccount: true, category: true, correction: true, correctedFrom: true } });
  if (!movement) notFound();
  return (
    <OperationalShell back={{ href: backHref, label: "Volver a movimientos" }} eyebrow={movement.voidedAt ? "Movimiento anulado" : "Movimiento confirmado"} title={movement.description || movement.category?.name || "Movimiento"} actions={!movement.voidedAt ? <Link className={styles.primaryLink} href={`/movimientos/${id}/editar`}>Corregir</Link> : undefined}>
      <section className={styles.panel}>
        <dl className={styles.detailGrid}>
          <div className={styles.detailRow}><dt>Tipo</dt><dd>{movement.type === "EXPENSE" ? "Gasto" : movement.type === "INCOME" ? "Ingreso" : "Transferencia"}</dd></div>
          <div className={styles.detailRow}><dt>Importe</dt><dd>${formatCents(movement.amountCents)}</dd></div>
          <div className={styles.detailRow}><dt>Fecha</dt><dd>{formatDateAR(movement.occurredOn)}</dd></div>
          <div className={styles.detailRow}><dt>Origen</dt><dd>{movement.sourceAccount.name}</dd></div>
          {movement.destinationAccount ? <div className={styles.detailRow}><dt>Destino</dt><dd>{movement.destinationAccount.name}</dd></div> : null}
          {movement.category ? <div className={styles.detailRow}><dt>Categoría</dt><dd>{movement.category.name}</dd></div> : null}
          <div className={styles.detailRow}><dt>Estado</dt><dd>{movement.voidedAt ? `Anulado · ${movement.voidReason}` : "Confirmado"}</dd></div>
          {movement.correction ? <div className={styles.detailRow}><dt>Corrección</dt><dd><Link className={styles.textLink} href={`/movimientos/${movement.correction.id}`}>Ver reemplazo</Link></dd></div> : null}
          {movement.correctedFrom ? <div className={styles.detailRow}><dt>Reemplaza</dt><dd><Link className={styles.textLink} href={`/movimientos/${movement.correctedFrom.id}`}>Ver original</Link></dd></div> : null}
        </dl>
        {!movement.voidedAt ? <form action={voidMovementAction} className={styles.dangerForm}><input name="id" type="hidden" value={id} /><label className={styles.field}><span>Motivo de anulación</span><input maxLength={160} minLength={4} name="reason" required /></label><button className={styles.dangerButton} type="submit">Anular sin borrar</button></form> : null}
      </section>
    </OperationalShell>
  );
}
