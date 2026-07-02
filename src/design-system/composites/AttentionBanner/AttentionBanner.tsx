"use client";

import { Button } from "../../primitives/Button";
import { Label } from "../../primitives/Label";
import { Surface } from "../../primitives/Surface";
import { motion, useReducedMotion } from "motion/react";
import { motionCurve, motionDuration } from "../../tokens";
import styles from "./AttentionBanner.module.css";

export interface AttentionBannerProps {
  title: string;
  detail: string;
  actionLabel: string;
  actionId?: string;
  onAction?: (actionId: string) => void;
  className?: string;
}

export function AttentionBanner({
  title,
  detail,
  actionLabel,
  actionId = "resolve",
  onAction,
  className,
}: AttentionBannerProps) {
  const reduceMotion = useReducedMotion();
  const classes = [styles.banner, className].filter(Boolean).join(" ");

  return (
    <motion.div
      animate={{ height: "auto", opacity: 1 }}
      className={styles.motionRoot}
      exit={{ height: reduceMotion ? "auto" : 0, opacity: 0 }}
      initial={{ height: reduceMotion ? "auto" : 0, opacity: 0 }}
      layout={reduceMotion ? false : "position"}
      transition={{
        duration: reduceMotion ? motionDuration.micro : motionDuration.reflow,
        ease: motionCurve.settle,
      }}
    >
      <Surface
        border="subtle"
        className={classes}
        padding="md"
        radius="lg"
        state="attention"
        tone="subtle"
      >
        <div className={styles.copy}>
          <Label as="p" className={styles.title} size="l" tone="primary">
            {title}
          </Label>
          <p className={styles.detail}>{detail}</p>
        </div>
        <Button kind="ghost" onClick={() => onAction?.(actionId)} width="hug">
          {actionLabel}
        </Button>
      </Surface>
    </motion.div>
  );
}
