"use client";

import type { ComponentPropsWithoutRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Surface } from "../../primitives/Surface";
import { motionCurve, motionDuration, motionSequence } from "../../tokens";
import styles from "./StabilityStatement.module.css";

export type StabilityStatementKind = "neutral" | "stable" | "attention" | "caution";
export type StabilityStatementContainer = "none" | "subtle";

export interface StabilityStatementProps extends ComponentPropsWithoutRef<"p"> {
  kind?: StabilityStatementKind;
  container?: StabilityStatementContainer;
}

export function StabilityStatement({
  kind = "neutral",
  container = "none",
  className,
  children,
  ...props
}: StabilityStatementProps) {
  const reduceMotion = useReducedMotion();
  const statementClasses = [styles.statement, styles[`kind-${kind}`], className]
    .filter(Boolean)
    .join(" ");
  const statement = (
    <AnimatePresence initial={false} mode="wait">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className={styles.motionRoot}
        exit={{
          opacity: 0,
          transition: { duration: motionDuration.micro, ease: motionCurve.exit },
          y: 0,
        }}
        initial={{ opacity: 0, y: reduceMotion ? 0 : "var(--space-4)" }}
        key={typeof children === "string" ? children : kind}
        transition={{
          delay: reduceMotion ? motionSequence.state : motionSequence.stability,
          duration: motionDuration.micro,
          ease: motionCurve.settle,
        }}
      >
        <p className={statementClasses} {...props}>
          {children}
        </p>
      </motion.div>
    </AnimatePresence>
  );

  if (container === "subtle") {
    return (
      <Surface padding="sm" radius="md" tone="subtle">
        {statement}
      </Surface>
    );
  }

  return statement;
}
