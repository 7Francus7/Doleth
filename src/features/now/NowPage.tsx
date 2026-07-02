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
import { AvailableEvidenceExperience } from "./evidence/AvailableEvidenceExperience";
import type { NowViewModel } from "./model";
import styles from "./NowPage.module.css";

export interface NowPageProps {
  model: NowViewModel;
}

export function NowPage({ model }: NowPageProps) {
  return (
    <main className="app-canvas">
      <h1 className={styles.screenTitle}>Ahora</h1>
      <div className={`app-canvas__content ${styles.content}`}>
        <SystemRail {...model.rail} />
        {model.banner ? <AttentionBanner {...model.banner} /> : null}
        <AvailableEvidenceExperience hero={model.hero} />
        <StabilityStatement {...model.stability} />
        <ActionStrip {...model.actions} />

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

        <div id="evidence">
          <InformationBlock {...model.information} />
        </div>
        {model.reserve ? <ReserveBlock {...model.reserve} /> : null}
      </div>
    </main>
  );
}
