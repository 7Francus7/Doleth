"use client";

import { ActionStrip } from "../../design-system/composites/ActionStrip";
import { AttentionBanner } from "../../design-system/composites/AttentionBanner";
import { FinancialRow } from "../../design-system/composites/FinancialRow";
import { InformationBlock } from "../../design-system/composites/InformationBlock";
import { StabilityStatement } from "../../design-system/composites/StabilityStatement";
import { SystemRail } from "../../design-system/composites/SystemRail";
import { Divider } from "../../design-system/primitives/Divider";
import { SectionTitle } from "../../design-system/primitives/SectionTitle";
import { Surface } from "../../design-system/primitives/Surface";
import { ChangeEvidenceExperience } from "./evidence";
import type { ChangesViewModel } from "./model";
import styles from "./ChangesPage.module.css";

export interface ChangesPageProps {
  model: ChangesViewModel;
}

export function ChangesPage({ model }: ChangesPageProps) {
  const actionProps = styles.actions ? { className: styles.actions } : {};
  const missingProps = styles.missing ? { className: styles.missing } : {};
  const informationProps = styles.information ? { className: styles.information } : {};

  const handleAction = (actionId: string) => {
    if (actionId === "evidence") {
      document.getElementById("changes-evidence")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    if (actionId === "facts") {
      document.getElementById("changes-facts")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    window.location.assign("/actuar");
  };

  return (
    <main className="app-canvas">
      <h1 className={styles.screenTitle}>Cambios</h1>
      <div className={`app-canvas__content ${styles.content}`}>
        <SystemRail {...model.rail} />
        {model.banner ? <AttentionBanner {...model.banner} onAction={handleAction} /> : null}
        <ChangeEvidenceExperience evidence={model.evidence} hero={model.hero} />

        <Surface
          border="subtle"
          className={styles.comparison}
          padding="md"
          radius="lg"
          tone="base"
        >
          {model.comparison.actionHref && model.comparison.actionLabel ? (
            <SectionTitle
              action="link"
              actionHref={model.comparison.actionHref}
              actionLabel={model.comparison.actionLabel}
              support="line"
              supportingLine={model.comparison.supportingLine}
              title={model.comparison.title}
            />
          ) : (
            <SectionTitle
              action="none"
              support="line"
              supportingLine={model.comparison.supportingLine}
              title={model.comparison.title}
            />
          )}
          <div className={styles.rows}>
            {model.comparison.rows.map((row, index) => (
              <div className={styles.unit} key={`${row.label}-${row.value}`}>
                {index > 0 ? <Divider /> : null}
                <FinancialRow {...row} />
              </div>
            ))}
          </div>
          <p
            className={styles.comparisonSummary}
            data-kind={model.comparison.summaryKind}
          >
            {model.comparison.summary}
          </p>
        </Surface>

        <StabilityStatement {...model.stability} />
        {model.actions ? <ActionStrip {...model.actions} {...actionProps} onAction={handleAction} /> : null}

        {model.explained ? (
          <Surface
            border="subtle"
            className={styles.section}
            id="changes-facts"
            padding="md"
            radius="lg"
            tone="base"
          >
            <SectionTitle title={model.explained.title} />
            <div className={styles.rows}>
              {model.explained.rows.map((row, index) => (
                <div className={styles.unit} key={`${row.label}-${row.value}`}>
                  {index > 0 ? <Divider /> : null}
                  <FinancialRow {...row} />
                </div>
              ))}
            </div>
          </Surface>
        ) : null}

        {model.missing ? <InformationBlock {...model.missing} {...missingProps} /> : null}

        <div id="changes-evidence">
          <InformationBlock {...model.information} {...informationProps} />
        </div>
      </div>
    </main>
  );
}
