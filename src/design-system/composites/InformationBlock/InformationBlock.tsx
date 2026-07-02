"use client";

import { AnimatePresence, motion } from "motion/react";
import { Label } from "../../primitives/Label";
import { Surface } from "../../primitives/Surface";
import { TextLink } from "../../primitives/TextLink";
import { motionCurve, motionDuration } from "../../tokens";
import styles from "./InformationBlock.module.css";

export type InformationBlockState = "complete" | "partial" | "stale" | "conflict";

export interface InformationBlockProps {
  title: string;
  primaryLine: string;
  causalLine: string;
  linkLabel: string;
  linkHref: string;
  state?: InformationBlockState;
  className?: string;
}

export function InformationBlock({
  title,
  primaryLine,
  causalLine,
  linkLabel,
  linkHref,
  state = "complete",
  className,
}: InformationBlockProps) {
  const classes = [styles.block, styles[`state-${state}`], className]
    .filter(Boolean)
    .join(" ");

  return (
    <Surface
      border={state === "complete" ? "subtle" : "state"}
      className={classes}
      padding="md"
      radius="lg"
      state={state === "conflict" ? "critical" : state === "complete" ? "default" : "attention"}
      tone="subtle"
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          animate={{ opacity: 1 }}
          className={styles.copy}
          exit={{
            opacity: 0,
            transition: { duration: motionDuration.micro, ease: motionCurve.exit },
          }}
          initial={{ opacity: 0 }}
          key={`${title}-${primaryLine}-${causalLine}`}
          transition={{ duration: motionDuration.micro, ease: motionCurve.snap }}
        >
          <Label as="p" size="m" tone="primary">
            {title}
          </Label>
          <p className={styles.primaryLine}>{primaryLine}</p>
          <p className={styles.causalLine}>{causalLine}</p>
        </motion.div>
      </AnimatePresence>
      <TextLink href={linkHref} kind="standalone" showChevron>
        {linkLabel}
      </TextLink>
    </Surface>
  );
}
