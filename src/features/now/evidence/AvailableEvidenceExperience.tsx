"use client";

import { useRef, useState } from "react";
import { Hero, type HeroProps } from "../../../design-system/composites/Hero";
import { AvailableEvidenceSheet } from "./AvailableEvidenceSheet";
import type { EvidenceBreakdown } from "./model";

export interface AvailableEvidenceExperienceProps {
  hero: HeroProps;
  evidence: EvidenceBreakdown;
}

export function AvailableEvidenceExperience({ evidence, hero }: AvailableEvidenceExperienceProps) {
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const availableTriggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Hero
        {...hero}
        onValueClick={() => setEvidenceOpen(true)}
        ref={availableTriggerRef}
        valueActionLabel="Ver evidencia del disponible"
      />
      <AvailableEvidenceSheet
        model={evidence}
        onOpenChange={setEvidenceOpen}
        open={evidenceOpen}
        returnFocusRef={availableTriggerRef}
      />
    </>
  );
}
