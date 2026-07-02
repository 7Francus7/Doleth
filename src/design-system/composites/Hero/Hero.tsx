"use client";

import { forwardRef } from "react";
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
  inlineNote?: string;
  tone?: HeroTone;
  className?: string;
  onValueClick?: () => void;
  valueActionLabel?: string;
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

export const Hero = forwardRef<HTMLButtonElement, HeroProps>(function Hero(
  {
    scenario,
    stateText,
    valueLabel,
    inlineNote,
    tone = "raised",
    className,
    ...props
  },
  valueButtonRef,
) {
  const classes = [styles.hero, styles[`scenario-${scenario}`], className]
    .filter(Boolean)
    .join(" ");
  const usesStateSurface = tone === "state-raised" && scenario === "attention";
  const value = "value" in props ? props.value : undefined;
  const valuePrefix = "valuePrefix" in props ? props.valuePrefix : undefined;
  const coverage = "coverage" in props ? props.coverage : undefined;
  const valueNode = (
    <NumericValue
      {...(valuePrefix !== undefined ? { prefix: valuePrefix } : {})}
      size="xl"
      state={scenario === "incomplete" ? (value ? "partial" : "unavailable") : "confirmed"}
      tone={scenario === "attention" ? "attention" : "neutral"}
      value={value ?? ""}
    />
  );

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
          {props.onValueClick ? (
            <button
              aria-haspopup="dialog"
              aria-label={props.valueActionLabel ?? `Ver evidencia de ${valueLabel}`}
              className={styles.valueButton}
              onClick={props.onValueClick}
              ref={valueButtonRef}
              type="button"
            >
              {valueNode}
            </button>
          ) : (
            valueNode
          )}
          <Label size="m" tone="secondary">
            {valueLabel}
          </Label>
          {inlineNote ? (
            <Label as="p" className={styles.inlineNote} size="s" tone="tertiary">
              {inlineNote}
            </Label>
          ) : null}
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
});
