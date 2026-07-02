"use client";

import { Button } from "../../primitives/Button";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { motionCurve, motionDuration, motionSequence } from "../../tokens";
import styles from "./ActionStrip.module.css";

export type ActionStripPrimary = "register" | "resolve" | "add-first-account" | "update";
export type ActionStripState = "default" | "reduced";

export interface ActionStripAction {
  id: string;
  label: string;
  disabled?: boolean;
}

export type ActionStripSecondaryActions =
  | readonly [ActionStripAction, ActionStripAction]
  | readonly [ActionStripAction, ActionStripAction, ActionStripAction]
  | readonly [ActionStripAction, ActionStripAction, ActionStripAction, ActionStripAction];

export interface ActionStripProps {
  primary: ActionStripPrimary;
  primaryLabel: string;
  secondaryActions: ActionStripSecondaryActions;
  state?: ActionStripState;
  onAction?: (actionId: string) => void;
  className?: string;
}

export function ActionStrip({
  primary,
  primaryLabel,
  secondaryActions,
  state = "default",
  onAction,
  className,
}: ActionStripProps) {
  const reduceMotion = useReducedMotion();
  const classes = [styles.actionStrip, styles[`state-${state}`], className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} data-primary={primary}>
      <Button onClick={() => onAction?.(primary)} size="lg" width="fill">
        <AnimatePresence initial={false} mode="wait">
          <motion.span
            animate={{ opacity: 1 }}
            className={styles.primaryLabel}
            exit={{
              opacity: 0,
              transition: { duration: motionDuration.micro, ease: motionCurve.exit },
            }}
            initial={{ opacity: 0 }}
            key={primaryLabel}
            transition={{
              delay: reduceMotion ? motionSequence.state : motionSequence.stability,
              duration: motionDuration.micro,
              ease: motionCurve.snap,
            }}
          >
            {primaryLabel}
          </motion.span>
        </AnimatePresence>
      </Button>
      <div className={styles.secondaryActions}>
        {secondaryActions.map((action) => (
          <Button
            disabled={action.disabled}
            key={action.id}
            kind="ghost"
            onClick={() => onAction?.(action.id)}
            width="fill"
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
