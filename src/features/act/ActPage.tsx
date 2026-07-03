import { SystemRail } from "../../design-system/composites/SystemRail";
import { Divider } from "../../design-system/primitives/Divider";
import { Label } from "../../design-system/primitives/Label";
import { NumericValue } from "../../design-system/primitives/NumericValue";
import { Surface } from "../../design-system/primitives/Surface";
import { TextLink } from "../../design-system/primitives/TextLink";
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
          <Label as="p" size="s" tone="secondary">
            {model.recommendation.confidenceLabel}
          </Label>
        </Surface>
      </div>
    </main>
  );
}
