"use client";

import { useRef, useState } from "react";
import { Hero, type HeroProps } from "../../../design-system/composites/Hero";
import type { HorizonEvidence } from "./model";
import { HorizonEvidenceSheet } from "./HorizonEvidenceSheet";

export interface HorizonEvidenceExperienceProps {
  hero: HeroProps;
  evidence: HorizonEvidence;
}

export function HorizonEvidenceExperience({
  hero,
  evidence,
}: HorizonEvidenceExperienceProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Hero
        {...hero}
        onValueClick={() => setOpen(true)}
        ref={triggerRef}
        valueActionLabel="Ver evidencia de la cobertura proxima"
      />
      <HorizonEvidenceSheet
        model={evidence}
        onOpenChange={setOpen}
        open={open}
        returnFocusRef={triggerRef}
      />
    </>
  );
}
