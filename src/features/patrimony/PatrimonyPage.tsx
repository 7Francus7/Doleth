import Link from "next/link";
import { SensitiveAmount } from "../../components/privacy/AmountPrivacy";
import { formatCents } from "../../lib/finance/domain";
import type { PatrimonyModel } from "./model";
import styles from "./patrimony.module.css";

const abs = (cents: bigint) => cents < 0n ? -cents : cents;
const signed = (cents: bigint, symbol: string) => `${cents < 0n ? "−" : ""}${symbol}${formatCents(abs(cents))}`;
const native = (currency: string, cents: bigint) => `${cents < 0n ? "−" : ""}${currency === "ARS" ? "$" : `${currency} `}${formatCents(abs(cents))}`;
const amountScale = (value: string) => value.replace(/\s/g, "").length >= 17 ? "extreme" : value.replace(/\s/g, "").length >= 14 ? "long" : "default";

export function PatrimonyPage({ model }: { model: PatrimonyModel }) {
  const patrimony = model.accountsComplete ? signed(model.patrimonyCents, model.displaySymbol) : "—";
  const invested = model.investmentsComplete ? signed(model.investmentTotalCents, model.displaySymbol) : "—";
  return <main className={styles.page}>
    <header className={styles.heading}>
      <div><p>Patrimonio</p><h1>Lo que tenés, sin mezclar.</h1></div>
      <Link href="/inversiones/nueva">+ Inversión</Link>
    </header>

    <section aria-labelledby="patrimony-title" className={styles.patrimony}>
      <div className={styles.hero}>
        <p id="patrimony-title">Patrimonio</p>
        <strong data-amount-scale={amountScale(patrimony)}><SensitiveAmount>{patrimony}</SensitiveAmount></strong>
        <span>{model.accountsComplete ? `En cuentas · valuado en ${model.displayCurrency}` : "Patrimonio parcial · falta cotización"}</span>
        {!model.accountsComplete && model.accountNativeTotals.length ? <dl className={styles.nativeTotals}>{model.accountNativeTotals.map((total) => <div key={total.currency}><dt>{total.currency}</dt><dd>{native(total.currency, total.cents)}</dd></div>)}</dl> : null}
      </div>
      <div className={styles.formula}>
        <header><p>Fórmula real</p><span>Σ saldos de todas las cuentas. La deuda entra con signo negativo.</span></header>
        {model.formula.map((part) => <Link href={part.href} key={part.id}><span>{part.label}</span><strong>{model.accountsComplete ? <SensitiveAmount>{signed(part.cents, model.displaySymbol)}</SensitiveAmount> : "—"}</strong><i aria-hidden="true">→</i></Link>)}
        <p className={styles.valuationNote}>{model.accountValuationNote || "Cada saldo es saldo inicial más movimientos vigentes."}</p>
      </div>
    </section>

    <aside className={styles.boundary}>
      <strong>Total combinado diferido</strong>
      <p>Las inversiones no se suman al patrimonio en cuentas: el modelo no registra qué cuenta las financió y no puede impedir doble conteo.</p>
    </aside>

    <section aria-labelledby="investments-title" className={styles.investments} id="inversiones">
      <header className={styles.sectionHeading}>
        <div><p>Capital colocado</p><h2 id="investments-title">Inversiones</h2></div>
        {model.investments.length ? <div className={styles.investmentTotal}><span>{model.investmentsComplete ? `Valuado en ${model.displayCurrency}` : "Cartera parcial"}</span><strong data-amount-scale={amountScale(invested)}><SensitiveAmount>{invested}</SensitiveAmount></strong>{model.investmentPerformance ? <small data-tone={model.investmentPerformance.tone}>{model.investmentPerformance.resultCents > 0n ? "+" : model.investmentPerformance.resultCents < 0n ? "−" : ""}{model.displaySymbol}{formatCents(abs(model.investmentPerformance.resultCents))} · {model.investmentPerformance.returnLabel}</small> : null}</div> : null}
      </header>

      {!model.investmentsComplete && model.investmentNativeTotals.length ? <dl className={styles.investmentNative}>{model.investmentNativeTotals.map((total) => <div key={total.currency}><dt>{total.currency}</dt><dd>{native(total.currency, total.cents)}</dd></div>)}</dl> : null}
      {model.investmentValuationNote ? <p className={styles.investmentNote}>{model.investmentValuationNote}</p> : null}

      {model.investments.length ? <div className={styles.investmentList}>{model.investments.map((investment) => <Link className={styles.investmentRow} data-tone={investment.tone} href={`/inversiones/${investment.id}`} key={investment.id}>
        <span><b>{investment.identity}</b><small>{investment.name !== investment.identity ? `${investment.name} · ` : ""}{investment.kindLabel}</small><em>{investment.source}</em></span>
        <span className={styles.values}><strong><SensitiveAmount>{investment.value}</SensitiveAmount></strong><small data-tone={investment.tone}>{investment.resultPrefix}{investment.result}{investment.returnLabel ? ` · ${investment.returnLabel}` : ""}</small></span>
        <i aria-hidden="true">→</i>
      </Link>)}</div> : <div className={styles.empty}><h3>Sin inversiones</h3><p>El patrimonio en cuentas sigue siendo válido. Registrá una inversión solo si querés seguir capital colocado aparte.</p><Link href="/inversiones/nueva">Registrar inversión</Link></div>}
    </section>

    {model.archivedInvestments.length ? <section aria-labelledby="archived-investments" className={styles.archived}><h2 id="archived-investments">Inversiones archivadas</h2>{model.archivedInvestments.map((investment) => <Link href={`/inversiones/${investment.id}`} key={investment.id}><span>{investment.identity}<small>{investment.source}</small></span><strong>{investment.value}</strong></Link>)}</section> : null}
  </main>;
}
