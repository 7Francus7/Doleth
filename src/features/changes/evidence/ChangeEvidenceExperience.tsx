"use client";

import { useRef, useState } from "react";
import { Hero, type HeroProps } from "../../../design-system/composites/Hero";
import type { ChangeEvidence } from "./model";
import { ChangeEvidenceSheet } from "./ChangeEvidenceSheet";

export interface ChangeEvidenceExperienceProps {
  hero: HeroProps;
  evidence: ChangeEvidence;
}

export function ChangeEvidenceExperience({
  hero,
  evidence,
}: ChangeEvidenceExperienceProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Hero
        {...hero}
        onValueClick={() => setOpen(true)}
        ref={triggerRef}
        valueActionLabel="Ver evidencia del cambio actual"
      />
      <ChangeEvidenceSheet
        model={evidence}
        onOpenChange={setOpen}
        open={open}
        returnFocusRef={triggerRef}
      />
    </>
  );
}
