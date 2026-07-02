import { Divider } from "../../primitives/Divider";
import { Label } from "../../primitives/Label";
import { NumericValue } from "../../primitives/NumericValue";
import { Surface } from "../../primitives/Surface";
import { CoverageMeter, type CoverageMeterProps } from "../CoverageMeter";
import styles from "./Hero.module.css";

export type HeroScenario = "stable" | "attention" | "incomplete" | "new";
export type HeroTone = "raised" | "state-raised";

interface HeroBaseProps {
  stateText: string;
  valueLabel: string;
  tone?: HeroTone;
  className?: string;
}

interface HeroMeasuredProps extends HeroBaseProps {
  scenario: "stable" | "attention";
  value: string;
  valuePrefix?: string;
  coverage: CoverageMeterProps;
}

interface HeroIncompleteProps extends HeroBaseProps {
  scenario: "incomplete";
  value?: string;
  valuePrefix?: string;
  coverage?: CoverageMeterProps;
}

interface HeroNewProps extends HeroBaseProps {
  scenario: "new";
  value?: never;
  valuePrefix?: never;
  coverage?: never;
}

export type HeroProps = HeroMeasuredProps | HeroIncompleteProps | HeroNewProps;

export function Hero({
  scenario,
  stateText,
  valueLabel,
  tone = "raised",
  className,
  ...props
}: HeroProps) {
  const classes = [styles.hero, styles[`scenario-${scenario}`], className]
    .filter(Boolean)
    .join(" ");
  const usesStateSurface = tone === "state-raised" && scenario === "attention";
  const value = "value" in props ? props.value : undefined;
  const valuePrefix = "valuePrefix" in props ? props.valuePrefix : undefined;
  const coverage = "coverage" in props ? props.coverage : undefined;

  return (
    <Surface
      border={usesStateSurface ? "state" : "default"}
      className={classes}
      elevation="soft"
      padding="lg"
      radius="xl"
      state={usesStateSurface ? "attention" : "default"}
      tone="raised"
    >
      <p className={styles.stateLine}>{stateText}</p>

      {scenario === "new" ? (
        <Label as="p" className={styles.newLabel} size="l" tone="secondary">
          {valueLabel}
        </Label>
      ) : (
        <div className={styles.valueGroup}>
          <NumericValue
            {...(valuePrefix !== undefined ? { prefix: valuePrefix } : {})}
            size="xl"
            state={scenario === "incomplete" ? "unavailable" : "confirmed"}
            tone={scenario === "attention" ? "attention" : "neutral"}
            value={value ?? ""}
          />
          <Label size="m" tone="secondary">
            {valueLabel}
          </Label>
        </div>
      )}

      {coverage ? (
        <div className={styles.coverageGroup}>
          <Divider />
          <CoverageMeter {...coverage} />
        </div>
      ) : null}
    </Surface>
  );
}
