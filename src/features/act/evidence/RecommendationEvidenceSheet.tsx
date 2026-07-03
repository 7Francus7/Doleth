"use client";

import type { RefObject } from "react";
import { BottomSheet } from "../../../design-system/composites/BottomSheet";
import { EvidenceRow } from "../../../design-system/composites/EvidenceRow";
import { Divider } from "../../../design-system/primitives/Divider";
import { Label } from "../../../design-system/primitives/Label";
import type { RecommendationEvidence } from "./model";
import styles from "./RecommendationEvidenceSheet.module.css";

export interface RecommendationEvidenceSheetProps {
  model: RecommendationEvidence;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

export function RecommendationEvidenceSheet({
  model,
  open,
  onOpenChange,
  returnFocusRef,
}: RecommendationEvidenceSheetProps) {
  return (
    <BottomSheet
      onOpenChange={onOpenChange}
      open={open}
      {...(returnFocusRef ? { returnFocusRef } : {})}
      subtitle={model.subtitle}
      title={model.title}
    >
      <div className={styles.content}>
        <section className={styles.explanation}>
          <Label as="p" size="m" tone="primary">
            {model.priorityLabel}
          </Label>
          <p className={styles.body}>{model.priorityReason}</p>
        </section>

        <Divider />

        <div className={styles.lines}>
          {model.lines.map((line, index) => (
            <div className={styles.line} key={line.id}>
              {index > 0 ? <Divider /> : null}
              <EvidenceRow
                label={line.label}
                value={line.displayValue}
                valuePrefix={line.valuePrefix}
              />
            </div>
          ))}
        </div>

        <Divider tone="default" />
        <EvidenceRow
          kind="total"
          label={model.missing.label}
          value={model.missing.displayValue}
          valuePrefix={model.missing.valuePrefix}
        />

        <Divider />

        <div className={styles.contextGrid}>
          <section className={styles.explanation}>
            <Label as="p" size="s" tone="secondary">
              {model.dateLabel}
            </Label>
            <p className={styles.body}>{model.dateValue}</p>
          </section>
          <section className={styles.explanation}>
            <Label as="p" size="s" tone="secondary">
              {model.waitLabel}
            </Label>
            <p className={styles.body}>{model.waitConsequence}</p>
          </section>
        </div>
      </div>
    </BottomSheet>
  );
}
