"use client";

import { useRef, useState } from "react";
import { Hero, type HeroProps } from "../../design-system/composites/Hero";
import type { EvidenceBreakdown } from "./model";
import { EvidenceBreakdownSheet } from "./EvidenceBreakdownSheet";

export interface EvidenceBreakdownExperienceProps {
  hero: HeroProps;
  evidence: EvidenceBreakdown | null;
  valueActionLabel: string;
}

export function EvidenceBreakdownExperience({
  hero,
  evidence,
  valueActionLabel,
}: EvidenceBreakdownExperienceProps) {
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
        valueActionLabel={valueActionLabel}
      />
      <EvidenceBreakdownSheet
        model={evidence}
        onOpenChange={setOpen}
        open={open}
        returnFocusRef={triggerRef}
      />
    </>
  );
}
