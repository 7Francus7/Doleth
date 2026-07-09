"use client";

import { useRef, useState } from "react";
import { Hero, type HeroProps } from "../../../design-system/composites/Hero";
import type { RealityEvidence } from "./model";
import { RealityEvidenceSheet } from "./RealityEvidenceSheet";

export interface RealityEvidenceExperienceProps {
  hero: HeroProps;
  evidence: RealityEvidence | null;
}

export function RealityEvidenceExperience({
  hero,
  evidence,
}: RealityEvidenceExperienceProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  if (!evidence) {
    return <Hero {...hero} />;
  }

  return (
    <>
      <Hero
        {...hero}
        onValueClick={() => setOpen(true)}
        ref={triggerRef}
        valueActionLabel="Ver evidencia de la base patrimonial"
      />
      <RealityEvidenceSheet
        model={evidence}
        onOpenChange={setOpen}
        open={open}
        returnFocusRef={triggerRef}
      />
    </>
  );
}
