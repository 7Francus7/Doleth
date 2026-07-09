"use client";

import type { RefObject } from "react";
import { BottomSheet } from "../../design-system/composites/BottomSheet";
import { EvidenceRow } from "../../design-system/composites/EvidenceRow";
import { SystemRail } from "../../design-system/composites/SystemRail";
import { Divider } from "../../design-system/primitives/Divider";
import type { EvidenceBreakdown } from "./model";
import styles from "./EvidenceBreakdownSheet.module.css";

export interface EvidenceBreakdownSheetProps {
  model: EvidenceBreakdown;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

export function EvidenceBreakdownSheet({
  model,
  open,
  onOpenChange,
  returnFocusRef,
}: EvidenceBreakdownSheetProps) {
  return (
    <BottomSheet
      onOpenChange={onOpenChange}
      open={open}
      {...(returnFocusRef ? { returnFocusRef } : {})}
      subtitle={model.subtitle}
      title={model.title}
    >
      <div className={styles.breakdown}>
        {model.summary ? <p className={styles.summary}>{model.summary}</p> : null}
        <div className={styles.lines}>
          {model.lines.map((line, index) => (
            <div className={styles.line} key={line.id}>
              {index > 0 ? <Divider /> : null}
              <EvidenceRow
                kind={line.amount !== null && line.amount < 0 ? "negative" : "neutral"}
                label={line.label}
                {...(line.sign ? { sign: line.sign } : {})}
                state={line.status === "missing" ? "partial" : "confirmed"}
                value={line.displayValue}
                valuePrefix={line.valuePrefix}
              />
            </div>
          ))}
        </div>
        <Divider tone="default" />
        <EvidenceRow
          kind="total"
          label={model.total.label}
          state={model.status === "partial" ? "partial" : "confirmed"}
          value={model.total.displayValue}
          valuePrefix={model.total.valuePrefix}
        />
        <SystemRail items={model.metadata} state={model.status} wrap="truncate" />
      </div>
    </BottomSheet>
  );
}
