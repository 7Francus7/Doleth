import Link from "next/link";
import { RestorableList } from "../../components/finance/RestorableList";
import { SensitiveAmount } from "../../components/privacy/AmountPrivacy";
import type { PlanModel } from "./model";
import styles from "./plan.module.css";

const STATE_LABEL = { OVERDUE: "Vencido", TODAY: "Hoy", PENDING: "Pendiente" } as const;
const frequencyLabel = (frequency: string | null) => frequency === "MONTHLY" ? "Mensual" : frequency;

export function PlanPage({ model }: { model: PlanModel }) {
  const count = model.groups.reduce((total, group) => total + group.payments.length, 0);
  return <main className={styles.page}>
    <header className={styles.heading}>
      <div><p>Plan</p><h1>¿Qué viene ahora?</h1></div>
      <Link href="/proximo/nuevo">+ Pago previsto</Link>
    </header>

    <nav aria-label="Horizonte" className={styles.horizons}>{([7, 30, 90] as const).map((days) => <Link aria-current={model.horizon === days ? "page" : undefined} href={`/proximo?horizon=${days}`} key={days}>{days} días</Link>)}</nav>

    <div className={styles.composition}>
      <aside className={styles.summary}>
        <p>Próximos {model.horizon} días</p>
        <span>Sale</span>
        {model.totals.length ? <dl>{model.totals.map((total) => <div key={total.currency}><dt>{total.currency}</dt><dd><SensitiveAmount>{total.currency === "ARS" ? "$" : `${total.currency} `}{total.amount}</SensitiveAmount></dd></div>)}</dl> : <strong>$0</strong>}
        <small>{count ? `${count} ${count === 1 ? "compromiso" : "compromisos"} hasta el ${model.horizonEnd}` : "No hay pagos previstos en este horizonte."}</small>
        <span>Entra</span>
        <p className={styles.incomeDeferred}>Los ingresos previstos todavía no están configurados.</p>
      </aside>

      <section aria-labelledby="timeline-title" className={styles.timeline}>
        <header><p>Próximo a salir</p><h2 id="timeline-title">Compromisos</h2></header>
        {model.groups.length ? <RestorableList restorationKey={model.restorationKey}>{model.groups.map((group) => <section aria-labelledby={`plan-${group.id}`} className={styles.group} key={group.id}>
          <h3 id={`plan-${group.id}`}>{group.title}</h3>
          {group.payments.map((payment) => <Link className={styles.payment} data-state={payment.state} href={payment.href} key={payment.id}>
            <span><b>{payment.concept}</b><small>{payment.dueLabel} · {payment.accountName}{payment.frequency ? ` · Repetir: ${frequencyLabel(payment.frequency)}` : ""}</small><em>{STATE_LABEL[payment.state]}</em></span>
            <strong><SensitiveAmount>−{payment.currency === "ARS" ? "$" : `${payment.currency} `}{payment.amount}</SensitiveAmount></strong>
            <i aria-hidden="true">→</i>
          </Link>)}</section>)}</RestorableList> : <div className={styles.empty}><h3>Nada previsto</h3><p>No hay pagos pendientes en los próximos {model.horizon} días.</p><Link href="/proximo/nuevo">Agregar pago previsto</Link></div>}
      </section>
    </div>

    {model.confirmed.length ? <section aria-labelledby="confirmed-title" className={styles.confirmed}><header><p>Historia reciente</p><h2 id="confirmed-title">Realizados</h2></header>{model.confirmed.map((payment) => <Link href={payment.href} key={payment.id}><span><b>{payment.concept}</b><small>{payment.dueLabel} · {payment.accountName}</small></span><strong><SensitiveAmount>−{payment.currency === "ARS" ? "$" : `${payment.currency} `}{payment.amount}</SensitiveAmount></strong><em>Realizado</em></Link>)}</section> : null}
  </main>;
}
