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
import { RealityEvidenceExperience } from "./evidence";
import type { RealityViewModel } from "./model";
import styles from "./RealityPage.module.css";

export interface RealityPageProps {
  model: RealityViewModel;
}

export function RealityPage({ model }: RealityPageProps) {
  const actionProps = styles.actions ? { className: styles.actions } : {};
  const missingProps = styles.missing ? { className: styles.missing } : {};
  const informationProps = styles.information ? { className: styles.information } : {};

  const handleAction = (actionId: string) => {
    if (actionId === "evidence") {
      document.getElementById("reality-evidence")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    if (actionId === "domains") {
      document.getElementById("reality-domains")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    window.location.assign("/actuar");
  };

  return (
    <main className="app-canvas">
      <h1 className={styles.screenTitle}>Mi realidad</h1>
      <div className={`app-canvas__content ${styles.content}`}>
        <SystemRail {...model.rail} />
        {model.banner ? <AttentionBanner {...model.banner} onAction={handleAction} /> : null}
        <RealityEvidenceExperience evidence={model.evidence} hero={model.hero} />

        <Surface
          border="subtle"
          className={styles.composition}
          padding="md"
          radius="lg"
          tone="base"
        >
          {model.composition.actionHref && model.composition.actionLabel ? (
            <SectionTitle
              action="link"
              actionHref={model.composition.actionHref}
              actionLabel={model.composition.actionLabel}
              support="line"
              supportingLine={model.composition.supportingLine}
              title={model.composition.title}
            />
          ) : (
            <SectionTitle
              action="none"
              support="line"
              supportingLine={model.composition.supportingLine}
              title={model.composition.title}
            />
          )}
          <div className={styles.rows}>
            {model.composition.rows.map((row, index) => (
              <div className={styles.unit} key={`${row.label}-${row.value}`}>
                {index > 0 ? <Divider /> : null}
                <FinancialRow {...row} />
              </div>
            ))}
          </div>
          <p
            className={styles.compositionSummary}
            data-kind={model.composition.summaryKind}
          >
            {model.composition.summary}
          </p>
        </Surface>

        <StabilityStatement {...model.stability} />
        {model.actions ? <ActionStrip {...model.actions} {...actionProps} onAction={handleAction} /> : null}

        {model.domains ? (
          <Surface
            border="subtle"
            className={styles.section}
            id="reality-domains"
            padding="md"
            radius="lg"
            tone="base"
          >
            <SectionTitle title={model.domains.title} />
            <div className={styles.rows}>
              {model.domains.rows.map((row, index) => (
                <div className={styles.unit} key={`${row.label}-${row.value}`}>
                  {index > 0 ? <Divider /> : null}
                  <FinancialRow {...row} />
                </div>
              ))}
            </div>
          </Surface>
        ) : null}

        {model.missing ? <InformationBlock {...model.missing} {...missingProps} /> : null}

        <div id="reality-evidence">
          <InformationBlock {...model.information} {...informationProps} />
        </div>
      </div>
    </main>
  );
}
