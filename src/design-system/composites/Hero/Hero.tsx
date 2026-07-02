"use client";

import { forwardRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { motionCurve, motionDuration, motionSequence } from "../../tokens";
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
  const reduceMotion = useReducedMotion();
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
  const animatedValue = (
    <AnimatePresence initial={false} mode="wait">
      <motion.span
        animate={{ opacity: 1, y: 0 }}
        className={styles.valueMotion}
        exit={{
          opacity: 0,
          transition: { duration: motionDuration.micro, ease: motionCurve.exit },
          y: reduceMotion ? 0 : "var(--space-4)",
        }}
        initial={{ opacity: 0, y: reduceMotion ? 0 : "calc(var(--space-4) * -1)" }}
        key={`${valuePrefix ?? ""}-${value ?? "unavailable"}`}
        transition={{
          delay: reduceMotion ? motionSequence.state : motionSequence.amount,
          duration: reduceMotion ? motionDuration.micro : motionDuration.numeric,
          ease: motionCurve.snap,
        }}
      >
        {valueNode}
      </motion.span>
    </AnimatePresence>
  );

  return (
    <motion.div
      className={styles.layout}
      layout={reduceMotion ? false : "position"}
      transition={{ duration: motionDuration.reflow, ease: motionCurve.settle }}
    >
      <Surface
        border={usesStateSurface ? "state" : "default"}
        className={classes}
        elevation="soft"
        padding="lg"
        radius="xl"
        state={usesStateSurface ? "attention" : "default"}
        tone="raised"
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.p
            animate={{ opacity: 1 }}
            className={styles.stateLine}
            exit={{
              opacity: 0,
              transition: { duration: motionDuration.micro, ease: motionCurve.exit },
            }}
            initial={{ opacity: 0 }}
            key={stateText}
            transition={{ duration: motionDuration.micro, ease: motionCurve.snap }}
          >
            {stateText}
          </motion.p>
        </AnimatePresence>

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
                {animatedValue}
              </button>
            ) : (
              animatedValue
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

        <AnimatePresence initial={false} mode="wait">
          {coverage ? (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className={styles.coverageGroup}
              exit={{
                opacity: 0,
                transition: { duration: motionDuration.micro, ease: motionCurve.exit },
                y: reduceMotion ? 0 : "var(--space-4)",
              }}
              initial={{ opacity: 0, y: reduceMotion ? 0 : "var(--space-4)" }}
              key={`${coverage.state ?? "stable"}-${coverage.value}-${coverage.title}`}
              transition={{
                delay: reduceMotion ? motionSequence.state : motionSequence.coverage,
                duration: reduceMotion ? motionDuration.micro : motionDuration.surface,
                ease: motionCurve.settle,
              }}
            >
              <Divider />
              <CoverageMeter {...coverage} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Surface>
    </motion.div>
  );
});
