"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Label } from "../../primitives/Label";
import { NumericValue, type NumericValueState } from "../../primitives/NumericValue";
import { motionCurve, motionDuration, motionSequence } from "../../tokens";
import styles from "./EvidenceRow.module.css";

export type EvidenceRowKind = "neutral" | "positive" | "negative" | "total";

export interface EvidenceRowProps {
  label: string;
  value: string;
  valuePrefix?: string;
  sign?: "+" | "-";
  kind?: EvidenceRowKind;
  state?: NumericValueState;
  expandable?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  children?: ReactNode;
  className?: string;
}

function EvidenceRowContent({
  label,
  value,
  valuePrefix,
  sign,
  kind = "neutral",
  state = "confirmed",
  expandable = false,
}: Omit<EvidenceRowProps, "children" | "className" | "expanded" | "onExpandedChange">) {
  const prefix = `${sign ?? ""}${valuePrefix ?? ""}`;

  return (
    <span className={styles.content}>
      <Label size={kind === "total" ? "l" : "m"} tone="primary">
        {label}
      </Label>
      <span className={styles.valueStack}>
        <NumericValue
          {...(prefix ? { prefix } : {})}
          size={kind === "total" ? "lg" : "md"}
          state={state}
          value={value}
        />
        {expandable ? <span aria-hidden="true" className={styles.chevron} /> : null}
      </span>
    </span>
  );
}

export function EvidenceRow({
  expandable = false,
  expanded,
  onExpandedChange,
  children,
  className,
  ...props
}: EvidenceRowProps) {
  const reduceMotion = useReducedMotion();
  const [internalExpanded, setInternalExpanded] = useState(false);
  const kind = props.kind ?? "neutral";
  const canExpand = expandable && kind !== "total";
  const isExpanded = canExpand && (expanded ?? internalExpanded);
  const classes = [styles.row, styles[`kind-${kind}`], className]
    .filter(Boolean)
    .join(" ");

  if (canExpand) {
    return (
      <div className={classes}>
        <button
          aria-expanded={isExpanded}
          className={styles.summary}
          onClick={() => {
            const nextExpanded = !isExpanded;
            setInternalExpanded(nextExpanded);
            onExpandedChange?.(nextExpanded);
          }}
          type="button"
        >
          <EvidenceRowContent {...props} expandable={false} />
          <motion.span
            animate={{ rotate: isExpanded ? 225 : 45 }}
            aria-hidden="true"
            className={styles.chevron}
            transition={{
              duration: reduceMotion ? motionSequence.state : motionDuration.micro,
              ease: motionCurve.snap,
            }}
          />
        </button>
        <AnimatePresence initial={false}>
          {isExpanded && children ? (
            <motion.div
              animate={{
                clipPath: "inset(0 0 0 0)",
                height: "auto",
                opacity: 1,
              }}
              className={styles.expandedContent}
              exit={{
                clipPath: reduceMotion ? "inset(0 0 0 0)" : "inset(0 0 100% 0)",
                height: reduceMotion ? "auto" : 0,
                opacity: 0,
              }}
              initial={{
                clipPath: reduceMotion ? "inset(0 0 0 0)" : "inset(0 0 100% 0)",
                height: reduceMotion ? "auto" : 0,
                opacity: 0,
              }}
              transition={{
                duration: reduceMotion ? motionDuration.micro : motionDuration.surface,
                ease: motionCurve.settle,
              }}
            >
              {children}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={classes}>
      <EvidenceRowContent {...props} />
    </div>
  );
}
