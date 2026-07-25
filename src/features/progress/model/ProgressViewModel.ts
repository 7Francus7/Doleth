import type { ActionStripProps } from "../../../design-system/composites/ActionStrip";
import type { AttentionBannerProps } from "../../../design-system/composites/AttentionBanner";
import type { CoverageMeterProps } from "../../../design-system/composites/CoverageMeter";
import type { FinancialRowProps } from "../../../design-system/composites/FinancialRow";
import type { HeroProps } from "../../../design-system/composites/Hero";
import type { InformationBlockProps } from "../../../design-system/composites/InformationBlock";
import type { StabilityStatementProps } from "../../../design-system/composites/StabilityStatement";
import type { SystemRailProps } from "../../../design-system/composites/SystemRail";
import type { EvidenceBreakdown } from "../../evidence/model";

/** Un indicador factual: qué mide, con qué denominador y qué dirección tiene. */
export interface ProgressIndicator {
  id: string;
  label: string;
  /** Lectura en palabras, siempre con su denominador. */
  reading: string;
  /** Fórmula declarada: sin ella el número no se puede auditar. */
  formula: string;
  /** Comparación factual contra la referencia, o su ausencia declarada. */
  reference: string;
  /** `null` cuando el indicador no tiene una dirección universalmente buena. */
  direction: "up-is-better" | "down-is-better" | null;
  state: "stable" | "attention" | "neutral";
  meter?: CoverageMeterProps;
}

/** Hito verificable contra el estado actual. Sin persistencia: no se celebra. */
export interface ProgressMilestone {
  id: string;
  label: string;
  detail: string;
  achieved: boolean;
}

export interface ProgressViewModel {
  rail: Pick<SystemRailProps, "items" | "state" | "wrap">;
  banner: Omit<AttentionBannerProps, "className" | "onAction"> | null;
  hero: HeroProps;
  evidence: EvidenceBreakdown | null;
  comparison: {
    title: string;
    supportingLine: string;
    rows: readonly FinancialRowProps[];
    summary: string;
    summaryKind: NonNullable<StabilityStatementProps["kind"]>;
  };
  indicators: {
    title: string;
    supportingLine: string;
    items: readonly ProgressIndicator[];
  } | null;
  milestones: {
    title: string;
    supportingLine: string;
    items: readonly ProgressMilestone[];
  } | null;
  /** Degradación declarada cuando falta una lectura secundaria. */
  notice: string | null;
  stability: Pick<StabilityStatementProps, "children" | "container" | "kind">;
  actions: Omit<ActionStripProps, "className" | "onAction"> | null;
  missing: InformationBlockProps | null;
  information: InformationBlockProps;
}
