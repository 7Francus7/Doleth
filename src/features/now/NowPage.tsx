"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DolethBrand } from "../../components/brand/DolethBrand";
import { SensitiveAmount, SensitiveText } from "../../components/privacy/AmountPrivacy";
import { FinancialRow } from "../../design-system/composites/FinancialRow";
import { ActionStrip } from "../../design-system/composites/ActionStrip";
import type { NowViewModel } from "./model";
import styles from "./NowPage.module.css";

export interface NowPageProps { model: NowViewModel }

const metricHref: Record<string, string> = {
  Ingresos: "/movimientos?type=INCOME",
  Gastos: "/movimientos?type=EXPENSE",
  Diferencia: "/movimientos",
};

const ACTION_ROUTES: Record<string, string> = {
  register: "/movimientos/nuevo",
  resolve: "/proximo",
  overdue: "/proximo",
  "add-first-account": "/cuentas/nueva",
  history: "/movimientos",
  accounts: "/cuentas",
  upcoming: "/proximo",
};

export function NowPage({ model }: NowPageProps) {
  const router = useRouter();
  const accounts = model.accounts ?? [];
  const measuredHero = "value" in model.hero && model.hero.value;
  const investment = model.investments;

  return (
    <main className={`app-canvas ${styles.canvas}`}>
      <div className={`app-canvas__content ${styles.content}`}>
        <header className={styles.masthead}>
          <DolethBrand />
          <div className={styles.issueLine}><span>Inicio</span><span>Situación actual</span></div>
        </header>

        {model.banner ? (
          <aside className={styles.alert}>
            <span>Atención</span>
            <p>{model.banner.title}</p>
            <small><SensitiveText>{model.banner.detail}</SensitiveText></small>
          </aside>
        ) : null}

        <section aria-labelledby="total-title" className={styles.hero} data-state={model.hero.scenario}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>Posición disponible</p>
            <h1 id="total-title"><SensitiveText>{model.hero.stateText}</SensitiveText></h1>
          </div>
          <div className={styles.heroValue}>
            {measuredHero ? (
              <strong><SensitiveAmount>{model.hero.valuePrefix}{model.hero.value}</SensitiveAmount></strong>
            ) : (
              <strong aria-label="Sin total disponible">—</strong>
            )}
            <span>{model.hero.valueLabel}</span>
            {model.hero.secondaryValue ? <small><SensitiveText>{model.hero.secondaryValue}</SensitiveText></small> : null}
          </div>
          {model.hero.inlineNote ? <p className={styles.heroNote}><SensitiveText>{model.hero.inlineNote}</SensitiveText></p> : null}
        </section>

        <ActionStrip
          {...model.actions}
          {...(styles.actionStrip ? { className: styles.actionStrip } : {})}
          onAction={(actionId) => router.push(ACTION_ROUTES[actionId] ?? "/movimientos/nuevo")}
        />

        <section aria-label="Resumen del período" className={styles.metrics}>
          {model.position.rows.map((row) => (
            <Link className={styles.metric} href={metricHref[row.label] ?? "/movimientos"} key={row.label}>
              <span>{row.label}</span>
              <strong><SensitiveAmount>{row.valuePrefix}{row.value}{row.valueSuffix}</SensitiveAmount></strong>
            </Link>
          ))}
          <Link className={styles.metric} href={investment?.href ?? "/mi-realidad#inversiones"}>
            <span>Invertido</span>
            <strong>
              {investment?.hasInvestments ? (
                <SensitiveAmount>{investment.valuePrefix}{investment.value}</SensitiveAmount>
              ) : "—"}
            </strong>
            <small>{investment?.hasInvestments ? investment.deltaLabel || "Cartera registrada" : "Sin cartera registrada"}</small>
          </Link>
        </section>

        {model.projection ? (
          <section aria-labelledby="projection-title" className={styles.projection}>
            <div>
              <p className={styles.kicker}>{model.projection.title}</p>
              <h2 id="projection-title"><SensitiveText>{model.projection.headline}</SensitiveText></h2>
            </div>
            <strong><SensitiveAmount>{model.projection.amountPrefix}{model.projection.amount}</SensitiveAmount></strong>
            <Link href={model.projection.linkHref}>{model.projection.linkLabel} →</Link>
          </section>
        ) : null}

        <div className={styles.ledgerGrid}>
          {model.operational?.map((section) => (
            <section aria-labelledby={`section-${section.title.replaceAll(" ", "-")}`} className={styles.ledger} key={section.title}>
              <header>
                <h2 id={`section-${section.title.replaceAll(" ", "-")}`}>{section.title}</h2>
                <Link href={section.actionHref}>{section.actionLabel}</Link>
              </header>
              {section.notice ? <p className={styles.notice}>{section.notice}</p> : null}
              <div>
                {section.rows.map((row, index) => <FinancialRow {...row} key={`${row.label}-${index}`} />)}
              </div>
            </section>
          ))}
        </div>

        <section aria-labelledby="accounts-title" className={styles.accounts}>
          <header>
            <div><p className={styles.kicker}>Base financiera</p><h2 id="accounts-title">Cuentas</h2></div>
            <Link href="/cuentas">Ver todas</Link>
          </header>
          {accounts.length ? (
            <div className={styles.accountList}>
              {accounts.map((account) => (
                <Link href={`/movimientos?accountId=${account.id}`} key={account.id}>
                  <span><small>{account.type}</small>{account.name}</span>
                  <strong><SensitiveAmount>{account.balancePrefix}{account.balance}</SensitiveAmount></strong>
                </Link>
              ))}
            </div>
          ) : (
            <Link className={styles.emptyAccount} href="/cuentas/nueva">+ Crear primera cuenta</Link>
          )}
        </section>

        <footer className={styles.evidence}>
          <div><p className={styles.kicker}>{model.information.title}</p><p>{model.information.primaryLine}</p></div>
          <p><SensitiveText>{model.information.causalLine}</SensitiveText></p>
          <p className={styles.stability}>{model.stability.children}</p>
          <Link href={model.information.linkHref}>{model.information.linkLabel} →</Link>
        </footer>
      </div>
    </main>
  );
}
