"use client";

import { useRouter } from "next/navigation";
import { ActionStrip } from "../../design-system/composites/ActionStrip";
import { AttentionBanner } from "../../design-system/composites/AttentionBanner";
import { CoverageMeter } from "../../design-system/composites/CoverageMeter";
import { FinancialRow } from "../../design-system/composites/FinancialRow";
import { InformationBlock } from "../../design-system/composites/InformationBlock";
import { StabilityStatement } from "../../design-system/composites/StabilityStatement";
import { SystemRail } from "../../design-system/composites/SystemRail";
import { Divider } from "../../design-system/primitives/Divider";
import { SectionTitle } from "../../design-system/primitives/SectionTitle";
import { Surface } from "../../design-system/primitives/Surface";
import { EvidenceBreakdownExperience } from "../evidence";
import type { ProgressViewModel } from "./model";
import styles from "./ProgressPage.module.css";

export interface ProgressPageProps {
  model: ProgressViewModel;
}

/** Rutas de cada acción. Navegación interna: la app no se recarga. */
const ACTION_ROUTES: Record<string, string> = {
  resolve: "/proximo",
  register: "/movimientos/nuevo",
  update: "/movimientos",
  "add-first-account": "/cuentas/nueva",
  changes: "/cambios",
  history: "/movimientos",
};

export function ProgressPage({ model }: ProgressPageProps) {
  const router = useRouter();
  const actionProps = styles.actions ? { className: styles.actions } : {};
  const missingProps = styles.missing ? { className: styles.missing } : {};
  const informationProps = styles.information ? { className: styles.information } : {};

  const handleAction = (actionId: string) => {
    router.push(ACTION_ROUTES[actionId] ?? "/progreso");
  };

  return (
    <main className="app-canvas">
      <h1 className={styles.screenTitle}>Progreso</h1>
      <div className={`app-canvas__content ${styles.content}`}>
        <SystemRail {...model.rail} />
        {model.banner ? <AttentionBanner {...model.banner} onAction={handleAction} /> : null}
        <EvidenceBreakdownExperience
          evidence={model.evidence}
          hero={model.hero}
          valueActionLabel="Ver cómo se calculó este resultado"
        />

        {model.notice ? (
          <p className={styles.notice} role="status">
            {model.notice}
          </p>
        ) : null}

        <section aria-label={model.comparison.title}>
          <Surface border="subtle" className={styles.comparison} padding="md" radius="lg" tone="base">
            <SectionTitle
              action="none"
              support="line"
              supportingLine={model.comparison.supportingLine}
              title={model.comparison.title}
            />
            <div className={styles.rows}>
              {model.comparison.rows.map((row, index) => (
                <div className={styles.unit} key={`${row.label}-${row.value}`}>
                  {index > 0 ? <Divider /> : null}
                  <FinancialRow {...row} />
                </div>
              ))}
            </div>
            <p className={styles.comparisonSummary} data-kind={model.comparison.summaryKind}>
              {model.comparison.summary}
            </p>
          </Surface>
        </section>

        <StabilityStatement {...model.stability} />
        {model.actions ? <ActionStrip {...model.actions} {...actionProps} onAction={handleAction} /> : null}

        {model.indicators ? (
          <section aria-label={model.indicators.title} id="progress-indicators">
            <Surface border="subtle" className={styles.section} padding="md" radius="lg" tone="base">
              <SectionTitle
                action="none"
                support="line"
                supportingLine={model.indicators.supportingLine}
                title={model.indicators.title}
              />
              <ul className={styles.indicators}>
                {model.indicators.items.map((indicator, index) => (
                  <li className={styles.indicator} key={indicator.id}>
                    {index > 0 ? <Divider /> : null}
                    <h3 className={styles.indicatorTitle}>{indicator.label}</h3>
                    <p className={styles.indicatorReading} data-state={indicator.state}>
                      {indicator.reading}
                    </p>
                    {indicator.meter ? <CoverageMeter {...indicator.meter} /> : null}
                    <p className={styles.indicatorMeta}>{indicator.reference}</p>
                    <p className={styles.indicatorMeta}>{indicator.formula}</p>
                  </li>
                ))}
              </ul>
            </Surface>
          </section>
        ) : null}

        {model.milestones ? (
          <section aria-label={model.milestones.title} id="progress-milestones">
            <Surface border="subtle" className={styles.section} padding="md" radius="lg" tone="base">
              <SectionTitle
                action="none"
                support="line"
                supportingLine={model.milestones.supportingLine}
                title={model.milestones.title}
              />
              <ul className={styles.milestones}>
                {model.milestones.items.map((milestone) => (
                  <li
                    className={styles.milestone}
                    data-achieved={milestone.achieved ? "true" : "false"}
                    key={milestone.id}
                  >
                    <span aria-hidden="true" className={styles.milestoneMark}>
                      {milestone.achieved ? "✓" : "·"}
                    </span>
                    <span className={styles.milestoneCopy}>
                      <span className={styles.milestoneLabel}>
                        {milestone.label}
                        <span className={styles.milestoneStatus}>
                          {milestone.achieved ? " · alcanzado" : " · todavía no"}
                        </span>
                      </span>
                      <span className={styles.milestoneDetail}>{milestone.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Surface>
          </section>
        ) : null}

        {model.missing ? <InformationBlock {...model.missing} {...missingProps} /> : null}

        <div id="progress-evidence">
          <InformationBlock {...model.information} {...informationProps} />
        </div>
      </div>
    </main>
  );
}
