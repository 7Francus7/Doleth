"use client";

import { useRef, useState } from "react";
import { Label } from "../../../design-system/primitives/Label";
import { TextLink } from "../../../design-system/primitives/TextLink";
import type { RecommendationEvidence } from "./model";
import { RecommendationEvidenceSheet } from "./RecommendationEvidenceSheet";
import styles from "./RecommendationEvidenceExperience.module.css";

export interface RecommendationEvidenceExperienceProps {
  confidenceLabel: string;
  evidence: RecommendationEvidence;
  triggerLabel: string;
}

export function RecommendationEvidenceExperience({
  confidenceLabel,
  evidence,
  triggerLabel,
}: RecommendationEvidenceExperienceProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  return (
    <>
      <div className={styles.summary}>
        <Label as="p" size="s" tone="secondary">
          {confidenceLabel}
        </Label>
        <TextLink
          href="#recommendation-evidence"
          kind="standalone"
          onClick={(event) => {
            event.preventDefault();
            triggerRef.current = event.currentTarget;
            setOpen(true);
          }}
        >
          {triggerLabel}
        </TextLink>
      </div>
      <RecommendationEvidenceSheet
        model={evidence}
        onOpenChange={setOpen}
        open={open}
        returnFocusRef={triggerRef}
      />
    </>
  );
}
