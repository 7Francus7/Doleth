"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DolethBrand } from "../../components/brand/DolethBrand";
import { SensitiveAmount } from "../../components/privacy/AmountPrivacy";
import { RestorableList } from "../../components/finance/RestorableList";
import { ActionStrip } from "../../design-system/composites/ActionStrip";
import { AttentionBanner } from "../../design-system/composites/AttentionBanner";
import { CoverageMeter } from "../../design-system/composites/CoverageMeter";
import { FinancialRow } from "../../design-system/composites/FinancialRow";
import { InformationBlock } from "../../design-system/composites/InformationBlock";
import { StabilityStatement } from "../../design-system/composites/StabilityStatement";
import { SystemRail } from "../../design-system/composites/SystemRail";
import { EmptyState } from "../../design-system/feedback";
import { Divider } from "../../design-system/primitives/Divider";
import { SectionTitle } from "../../design-system/primitives/SectionTitle";
import { Surface } from "../../design-system/primitives/Surface";
import { EvidenceBreakdownExperience } from "../evidence";
import type { NextViewModel } from "./model";
import styles from "./NextPage.module.css";

export interface NextPageProps {
  model: NextViewModel;
}

/** Rutas de cada acción. Navegación interna: la app no se recarga. */
const ACTION_ROUTES: Record<string, string> = {
  register: "/proximo/nuevo",
  resolve: "/proximo",
  overdue: "/proximo",
  "add-first-account": "/cuentas/nueva",
  now: "/ahora",
  history: "/movimientos",
};

export function NextPage({ model }: NextPageProps) {
  const router = useRouter();
  const actionProps = styles.actions ? { className: styles.actions } : {};
  const informationProps = styles.information ? { className: styles.information } : {};

  const handleAction = (actionId: string) => {
    router.push(ACTION_ROUTES[actionId] ?? "/proximo/nuevo");
  };

  return (
    <main className="app-canvas">
      <div className={`app-canvas__content ${styles.content}`}>
        <header className={styles.topBar}>
          <DolethBrand />
          <h1 className={styles.screenTitle}>Próximo</h1>
        </header>
        <SystemRail {...model.rail} />
        {model.banner ? <AttentionBanner {...model.banner} onAction={handleAction} /> : null}
        <EvidenceBreakdownExperience
          evidence={model.evidence}
          hero={model.hero}
          valueActionLabel="Ver el detalle de los pagos pendientes"
        />
        <StabilityStatement {...model.stability} />
        {model.actions ? <ActionStrip {...model.actions} {...actionProps} onAction={handleAction} /> : null}

        {model.coverage ? (
          <section aria-labelledby="coverage-title">
            <Surface border="subtle" className={styles.coverage} padding="md" radius="lg" tone="base">
              <h2 className={styles.sectionHeading} id="coverage-title">Cobertura</h2>
              <p className={styles.coverageHeadline}>{model.coverage.headline}</p>
              <p className={styles.coverageDetail}>{model.coverage.detail}</p>
              <CoverageMeter {...model.coverage.meter} />
              {model.coverage.note ? <p className={styles.coverageNote}>{model.coverage.note}</p> : null}
            </Surface>
          </section>
        ) : null}

        {model.timeline.length ? (
          <section aria-labelledby="timeline-title" className={styles.timeline}>
            <h2 className={styles.sectionHeading} id="timeline-title">Línea de pagos</h2>
            <RestorableList className={styles.timelineGroups} restorationKey={model.restorationKey}>
              {model.timeline.map((group) => (
                <section aria-labelledby={`group-${group.id}`} className={styles.group} key={group.id}>
                  <div className={styles.groupHeader} data-tone={group.tone}>
                    <h3 id={`group-${group.id}`}>{group.title}</h3>
                    <p>{group.summary}</p>
                  </div>
                  <ol className={styles.payments}>
                    {group.payments.map((payment) => (
                      <li key={payment.id}>
                        <Link className={styles.payment} data-state={payment.state} href={payment.href}>
                          <span className={styles.paymentCopy}>
                            <span className={styles.paymentConcept}>{payment.concept}</span>
                            <span className={styles.paymentMeta}>
                              {payment.dateLabel} · {payment.accountName}
                            </span>
                            <span className={styles.paymentState} data-state={payment.state}>
                              {payment.stateLabel}
                            </span>
                          </span>
                          <span className={styles.paymentAmount}>
                            <SensitiveAmount>{payment.amountPrefix}{payment.amount}</SensitiveAmount>
                          </span>
                        </Link>
                        <p className={styles.paymentAfter} data-state={payment.balanceAfterState}>
                          <SensitiveAmount sensitive={payment.balanceAfterLabel.includes("$")}>
                            {payment.balanceAfterLabel}
                          </SensitiveAmount>
                        </p>
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
            </RestorableList>
          </section>
        ) : null}

        {model.empty ? (
          <EmptyState
            description={model.empty.description}
            primaryAction={
              <Link className={styles.emptyAction} href={model.empty.actionHref}>
                {model.empty.actionLabel}
              </Link>
            }
            title={model.empty.title}
          />
        ) : null}

        {model.confirmed ? (
          <Surface border="subtle" className={styles.section} padding="md" radius="lg" tone="base">
            <SectionTitle title={model.confirmed.title} />
            <p className={styles.coverageNote}>{model.confirmed.caption}</p>
            <div className={styles.rows}>
              {model.confirmed.rows.map((row, index) => (
                <div className={styles.unit} key={`${row.label}-${row.value}-${index}`}>
                  {index > 0 ? <Divider /> : null}
                  <FinancialRow {...row} />
                </div>
              ))}
            </div>
          </Surface>
        ) : null}

        <InformationBlock {...model.information} {...informationProps} />
      </div>
    </main>
  );
}
