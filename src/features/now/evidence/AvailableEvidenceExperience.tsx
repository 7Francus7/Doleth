"use client";

import { useRef, useState } from "react";
import { Hero, type HeroProps } from "../../../design-system/composites/Hero";
import { AvailableEvidenceSheet } from "./AvailableEvidenceSheet";
import { availableEvidenceFixture } from "./fixtures";

export interface AvailableEvidenceExperienceProps {
  hero: HeroProps;
}

export function AvailableEvidenceExperience({ hero }: AvailableEvidenceExperienceProps) {
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
        model={availableEvidenceFixture}
        onOpenChange={setEvidenceOpen}
        open={evidenceOpen}
        returnFocusRef={availableTriggerRef}
      />
    </>
  );
}
