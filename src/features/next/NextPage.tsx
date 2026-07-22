"use client";

import { DolethBrand } from "../../components/brand/DolethBrand";
import { ActionStrip } from "../../design-system/composites/ActionStrip";
import { AttentionBanner } from "../../design-system/composites/AttentionBanner";
import { FinancialRow } from "../../design-system/composites/FinancialRow";
import { InformationBlock } from "../../design-system/composites/InformationBlock";
import { StabilityStatement } from "../../design-system/composites/StabilityStatement";
import { SystemRail } from "../../design-system/composites/SystemRail";
import { Divider } from "../../design-system/primitives/Divider";
import { SectionTitle } from "../../design-system/primitives/SectionTitle";
import { Surface } from "../../design-system/primitives/Surface";
import { EvidenceBreakdownExperience } from "../evidence";
import type { NextViewModel } from "./model";
import styles from "./NextPage.module.css";

export interface NextPageProps {
  model: NextViewModel;
}

export function NextPage({ model }: NextPageProps) {
  const actionProps = styles.actions ? { className: styles.actions } : {};
  const informationProps = styles.information ? { className: styles.information } : {};
  const riskProps = styles.risk ? { className: styles.risk } : {};

  const handleAction = (actionId: string) => {
    if (actionId === "evidence") {
      document.getElementById("next-evidence")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    const routes: Record<string, string> = {
      register: "/proximo/nuevo",
      "add-first-account": "/cuentas/nueva",
      history: "/movimientos",
      accounts: "/cuentas",
    };
    window.location.assign(routes[actionId] ?? "/proximo/nuevo");
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
          valueActionLabel="Ver evidencia de la cobertura proxima"
        />
        <StabilityStatement {...model.stability} />
        {model.actions ? <ActionStrip {...model.actions} {...actionProps} onAction={handleAction} /> : null}

        {model.confirmed ? (
          <Surface border="subtle" className={styles.section} padding="md" radius="lg" tone="base">
            <SectionTitle title={model.confirmed.title} />
            <div className={styles.rows}>
              {model.confirmed.rows.map((row, index) => (
                <div className={styles.unit} key={`${row.label}-${row.value}`}>
                  {index > 0 ? <Divider /> : null}
                  <FinancialRow {...row} />
                </div>
              ))}
            </div>
          </Surface>
        ) : null}

        {model.expected ? (
          <Surface border="subtle" className={styles.section} padding="md" radius="lg" tone="base">
            <SectionTitle title={model.expected.title} />
            <div className={styles.rows}>
              {model.expected.rows.map((row, index) => (
                <div className={styles.unit} key={`${row.label}-${row.value}`}>
                  {index > 0 ? <Divider /> : null}
                  <FinancialRow {...row} />
                </div>
              ))}
            </div>
          </Surface>
        ) : null}

        {model.risk ? <InformationBlock {...model.risk} {...riskProps} /> : null}

        <div id="next-evidence">
          <InformationBlock {...model.information} {...informationProps} />
        </div>
      </div>
    </main>
  );
}
