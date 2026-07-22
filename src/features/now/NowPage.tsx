"use client";

import { AnimatePresence, LayoutGroup } from "motion/react";
import Link from "next/link";
import { DolethBrand } from "../../components/brand/DolethBrand";
import { ActionStrip } from "../../design-system/composites/ActionStrip";
import { AttentionBanner } from "../../design-system/composites/AttentionBanner";
import { FinancialRow } from "../../design-system/composites/FinancialRow";
import { InformationBlock } from "../../design-system/composites/InformationBlock";
import { ReserveBlock } from "../../design-system/composites/ReserveBlock";
import { StabilityStatement } from "../../design-system/composites/StabilityStatement";
import { SystemRail } from "../../design-system/composites/SystemRail";
import { TrendChart } from "../../design-system/composites/TrendChart";
import { Divider } from "../../design-system/primitives/Divider";
import { SectionTitle } from "../../design-system/primitives/SectionTitle";
import { Surface } from "../../design-system/primitives/Surface";
import { EvidenceBreakdownExperience } from "../evidence";
import type { NowViewModel } from "./model";
import styles from "./NowPage.module.css";

export interface NowPageProps {
  model: NowViewModel;
}

export function NowPage({ model }: NowPageProps) {
  const actionStripProps = styles.actions ? { className: styles.actions } : {};
  const reserveProps = styles.reserve ? { className: styles.reserve } : {};
  const informationProps = styles.information ? { className: styles.information } : {};
  const accounts = model.accounts ?? [];
  const trend = model.trend ?? [];
  const handleAction = (actionId: string) => {
    if (actionId === "evidence") {
      document.getElementById("evidence")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const routes: Record<string, string> = {
      register: "/movimientos/nuevo",
      "add-first-account": "/cuentas/nueva",
      history: "/movimientos",
      accounts: "/cuentas",
      upcoming: "/proximo",
    };
    window.location.assign(routes[actionId] ?? "/movimientos/nuevo");
  };

  return (
    <main className="app-canvas">
      <div className={`app-canvas__content ${styles.content}`}>
        <header className={styles.topBar}>
          <div>
            <DolethBrand />
            <h1 className={styles.screenTitle}>Ahora</h1>
          </div>
          <Link aria-label="Gestionar cuentas" className={styles.accountShortcut} href="/cuentas">
            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
              <path d="M4 7.5h16v11H4zM7 7.5V5.8c0-.9.7-1.6 1.6-1.6h6.8c.9 0 1.6.7 1.6 1.6v1.7M7.5 12h9" />
            </svg>
          </Link>
        </header>
        <SystemRail {...model.rail} />
        <LayoutGroup id="now-primary-state">
          <AnimatePresence initial={false}>
            {model.banner ? (
              <AttentionBanner key="attention" {...model.banner} onAction={handleAction} />
            ) : null}
          </AnimatePresence>
          <EvidenceBreakdownExperience
            evidence={model.evidence}
            hero={model.hero}
            valueActionLabel="Ver evidencia del disponible"
          />
        </LayoutGroup>
        <StabilityStatement {...model.stability} />
        <ActionStrip {...model.actions} {...actionStripProps} onAction={handleAction} />
        {model.reserve ? <ReserveBlock {...model.reserve} {...reserveProps} /> : null}

        {accounts.length > 0 ? (
          <section aria-labelledby="accounts-title" className={styles.accountsSection}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Base financiera</p>
                <h2 id="accounts-title">Mis cuentas</h2>
              </div>
              <Link href="/cuentas">Gestionar</Link>
            </div>
            <div className={styles.accountScroller}>
              {accounts.map((account) => (
                <article className={styles.accountCard} data-state={account.state} key={account.id}>
                  <div className={styles.accountCardTopline}>
                    <span>{account.type}</span>
                    <span aria-hidden="true">•••</span>
                  </div>
                  <p>{account.name}</p>
                  <strong>{account.balancePrefix}{account.balance}</strong>
                </article>
              ))}
              <Link className={styles.addAccountCard} href="/cuentas/nueva">
                <span aria-hidden="true">+</span>
                Nueva cuenta
              </Link>
            </div>
          </section>
        ) : null}

        {model.investments ? (
          <Link className={styles.investmentsEntry} data-empty={!model.investments.hasInvestments} href={model.investments.href}>
            <div className={styles.investmentsCopy}>
              <span className={styles.investmentsEyebrow}>Cartera de inversiones</span>
              {model.investments.hasInvestments ? (
                <strong className={styles.investmentsValue}>
                  {model.investments.valuePrefix}{model.investments.value}
                </strong>
              ) : (
                <span className={styles.investmentsCta}>Registrá tu primera inversión</span>
              )}
            </div>
            {model.investments.hasInvestments && model.investments.deltaLabel ? (
              <span className={styles.investmentsDelta} data-state={model.investments.deltaState}>
                {model.investments.deltaLabel}
              </span>
            ) : (
              <span aria-hidden="true" className={styles.investmentsChevron}>›</span>
            )}
          </Link>
        ) : null}

        <Surface
          border="subtle"
          className={styles.position}
          padding="md"
          radius="lg"
          tone="base"
        >
          <SectionTitle title={model.position.title} />
          <div className={styles.trendHeader}>
            <p>Ingresos y gastos</p>
          </div>
          <TrendChart points={trend} />
          <div className={styles.positionRows}>
            {model.position.rows.map((row, index) => (
              <div className={styles.positionUnit} key={`${row.label}-${row.value}`}>
                {index > 0 ? <Divider /> : null}
                <FinancialRow {...row} />
              </div>
            ))}
          </div>
        </Surface>

        {model.operational?.map((section) => (
          <Surface border="subtle" className={styles.position} key={section.title} padding="md" radius="lg" tone="base">
            <SectionTitle action="link" actionHref={section.actionHref} actionLabel={section.actionLabel} title={section.title} />
            <div className={styles.positionRows}>
              {section.rows.map((row, index) => (
                <div className={styles.positionUnit} key={`${row.label}-${row.value}-${index}`}>
                  {index > 0 ? <Divider /> : null}
                  <FinancialRow {...row} />
                </div>
              ))}
            </div>
          </Surface>
        ))}

        <div id="evidence">
          <InformationBlock {...model.information} {...informationProps} />
        </div>
      </div>
    </main>
  );
}
