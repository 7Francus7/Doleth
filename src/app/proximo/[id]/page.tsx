import Link from "next/link";
import { notFound } from "next/navigation";
import { OperationalShell } from "../../../components/finance/OperationalShell";
import { PayUpcomingPaymentForm } from "../../../components/finance/PayUpcomingPaymentForm";
import { getDb } from "../../../lib/db";
import { formatCents, todayInArgentina } from "../../../lib/finance/domain";
import styles from "../../../components/finance/finance.module.css";

export const dynamic = "force-dynamic";

export default async function UpcomingPaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payment = await getDb().upcomingPayment.findUnique({ where: { id }, include: { plannedAccount: true, transaction: true } });
  if (!payment) notFound();
  return (
    <OperationalShell eyebrow={payment.status === "PAID" ? "Pago convertido" : "Pago pendiente"} title={payment.concept}>
      <section className={styles.panel}>
        <dl className={styles.detailGrid}>
          <div className={styles.detailRow}><dt>Importe estimado</dt><dd>${formatCents(payment.estimatedCents)}</dd></div>
          <div className={styles.detailRow}><dt>Vencimiento</dt><dd>{payment.dueOn.toISOString().slice(0, 10)}</dd></div>
          <div className={styles.detailRow}><dt>Cuenta prevista</dt><dd>{payment.plannedAccount.name}</dd></div>
          <div className={styles.detailRow}><dt>Frecuencia</dt><dd>{payment.frequency || "Única"}</dd></div>
          <div className={styles.detailRow}><dt>Estado</dt><dd>{payment.status === "PAID" ? "Pagado" : "Pendiente"}</dd></div>
        </dl>
        {payment.transaction ? <Link className={styles.textLink} href={`/movimientos/${payment.transaction.id}`}>Ver movimiento generado</Link> : (
          <PayUpcomingPaymentForm paymentId={payment.id} today={todayInArgentina()} />
        )}
      </section>
    </OperationalShell>
  );
}
