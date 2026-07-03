import { FinancialRow } from "../../design-system/composites/FinancialRow";
import { SystemRail } from "../../design-system/composites/SystemRail";
import { Button } from "../../design-system/primitives/Button";
import { Divider } from "../../design-system/primitives/Divider";
import { Label } from "../../design-system/primitives/Label";
import { NumericValue } from "../../design-system/primitives/NumericValue";
import { SectionTitle } from "../../design-system/primitives/SectionTitle";
import { Surface } from "../../design-system/primitives/Surface";
import { TextLink } from "../../design-system/primitives/TextLink";
import { RecommendationEvidenceExperience } from "./evidence";
import type { ActViewModel } from "./model";
import styles from "./ActPage.module.css";

export interface ActPageProps {
  model: ActViewModel;
}

export function ActPage({ model }: ActPageProps) {
  return (
    <main className={`app-canvas ${styles.canvas}`}>
      <div className={`app-canvas__content ${styles.content}`}>
        <header className={styles.navigation}>
          <TextLink className={styles.backLink} href={model.navigation.backHref} kind="standalone">
            {model.navigation.backLabel}
          </TextLink>
          <h1 className={styles.title}>{model.navigation.title}</h1>
          <span aria-hidden="true" className={styles.navigationReserve} />
        </header>

        <SystemRail className={styles.rail} {...model.rail} />

        <Surface
          border="default"
          className={styles.recommendation}
          elevation="soft"
          padding="lg"
          radius="xl"
          tone="raised"
        >
          <Label as="p" size="m" tone="secondary">
            {model.recommendation.stateLabel}
          </Label>
          <h2 className={styles.conclusion}>{model.recommendation.conclusion}</h2>
          <NumericValue {...model.recommendation.amount} />
          <p className={styles.consequence}>{model.recommendation.consequence}</p>
          <Divider className={styles.divider} />
          <RecommendationEvidenceExperience
            confidenceLabel={model.recommendation.confidenceLabel}
            evidence={model.evidence}
            triggerLabel={model.recommendation.evidenceTriggerLabel}
          />
        </Surface>

        <p className={styles.reason}>{model.reason}</p>

        <Surface
          border="subtle"
          className={styles.impact}
          padding="sm"
          radius="lg"
          tone="base"
        >
          <SectionTitle title={model.impact.title} />
          <div className={styles.impactRows}>
            {model.impact.rows.map((row, index) => (
              <div className={styles.impactUnit} key={row.label}>
                {index > 0 ? <Divider /> : null}
                <FinancialRow {...row} className={styles.impactRow!} />
              </div>
            ))}
          </div>
        </Surface>

        <div className={styles.decision}>
          <Button kind="primary" size="lg" width="fill">
            {model.decision.primaryLabel}
          </Button>
          <div className={styles.secondaryActions}>
            {model.decision.secondaryActions.map((action) => (
              <TextLink href={action.href} key={action.label} kind="standalone">
                {action.label}
              </TextLink>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
