import Link from "next/link";
import { RestorableList } from "../../components/finance/RestorableList";
import { SensitiveAmount } from "../../components/privacy/AmountPrivacy";
import { EmptyState } from "../../design-system/feedback";
import { formatValued, type AccountsViewModel } from "./model";
import styles from "./accounts.module.css";

export function AccountsPage({ model }: { model: AccountsViewModel }) {
  const active = model.accounts.filter((account) => account.status === "ACTIVE");
  const archived = model.accounts.filter((account) => account.status === "ARCHIVED");
  return <div className={styles.composition}>
    <section aria-labelledby="available-title" className={styles.hero}>
      <p id="available-title">Disponible</p>
      {model.totalComplete ? <strong><SensitiveAmount>{formatValued(model.availableCents, model.displaySymbol)}</SensitiveAmount></strong> : <strong>—</strong>}
      <span>{model.totalComplete ? `Valuado en ${model.displayCurrency}` : "Total no disponible: falta una cotización"}</span>
      {model.currencyTotals.length > 1 ? <dl>{model.currencyTotals.map((total) => <div key={total.currency}><dt>{total.currency}</dt><dd>{total.currency === "ARS" ? "$" : `${total.currency} `}{total.formatted}</dd></div>)}</dl> : null}
      <div className={styles.heroBreakdown}>
        <span><small>Ahorro</small><b>{model.totalComplete ? formatValued(model.savingsCents, model.displaySymbol) : "—"}</b></span>
        <span><small>Tarjetas / deuda</small><b>{model.totalComplete ? formatValued(model.debtCents, model.displaySymbol) : "—"}</b></span>
      </div>
    </section>

    <section aria-labelledby="accounts-title" className={styles.accountsList}>
      <header><div><p>Mapa del dinero</p><h2 id="accounts-title">Cuentas activas</h2></div><Link href="/cuentas/nueva">+ Crear cuenta</Link></header>
      {active.length ? <RestorableList restorationKey="/cuentas">{active.map((account) => <Link className={styles.accountRow} data-bucket={account.bucket} href={`/cuentas/${account.id}`} key={account.id}>
        <span><strong>{account.name}</strong><small>{account.typeLabel} · {account.currency}</small></span>
        <b><SensitiveAmount>{account.balance}</SensitiveAmount></b><i aria-hidden="true">→</i>
      </Link>)}</RestorableList> : <EmptyState description={archived.length ? "Reactivá una cuenta archivada o creá una nueva." : "Creá una cuenta para representar dónde está tu dinero."} primaryAction={<Link className={styles.primaryAction} href="/cuentas/nueva">+ Crear cuenta</Link>} title={archived.length ? "Todas tus cuentas están archivadas" : "No tenés cuentas"} />}
    </section>

    {archived.length ? <section aria-labelledby="archived-title" className={styles.archivedList}><h2 id="archived-title">Archivadas</h2>{archived.map((account) => <Link href={`/cuentas/${account.id}`} key={account.id}><span>{account.name}<small>{account.typeLabel} · {account.currency}</small></span><b>{account.balance}</b></Link>)}</section> : null}
  </div>;
}
