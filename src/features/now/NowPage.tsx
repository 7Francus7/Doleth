"use client";

import { AnimatePresence, LayoutGroup } from "motion/react";
import { ActionStrip } from "../../design-system/composites/ActionStrip";
import { AttentionBanner } from "../../design-system/composites/AttentionBanner";
import { FinancialRow } from "../../design-system/composites/FinancialRow";
import { InformationBlock } from "../../design-system/composites/InformationBlock";
import { ReserveBlock } from "../../design-system/composites/ReserveBlock";
import { StabilityStatement } from "../../design-system/composites/StabilityStatement";
import { SystemRail } from "../../design-system/composites/SystemRail";
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
      <h1 className={styles.screenTitle}>Ahora</h1>
      <div className={`app-canvas__content ${styles.content}`}>
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

        <Surface
          border="subtle"
          className={styles.position}
          padding="md"
          radius="lg"
          tone="base"
        >
          <SectionTitle title={model.position.title} />
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
