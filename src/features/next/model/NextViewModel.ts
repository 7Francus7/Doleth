import type { ActionStripProps } from "../../../design-system/composites/ActionStrip";
import type { AttentionBannerProps } from "../../../design-system/composites/AttentionBanner";
import type { FinancialRowProps } from "../../../design-system/composites/FinancialRow";
import type { HeroProps } from "../../../design-system/composites/Hero";
import type { InformationBlockProps } from "../../../design-system/composites/InformationBlock";
import type { StabilityStatementProps } from "../../../design-system/composites/StabilityStatement";
import type { SystemRailProps } from "../../../design-system/composites/SystemRail";
import type { EvidenceBreakdown } from "../../evidence/model";

export interface NextViewModel {
  rail: Pick<SystemRailProps, "items" | "state" | "wrap">;
  banner: Omit<AttentionBannerProps, "className" | "onAction"> | null;
  hero: HeroProps;
  evidence: EvidenceBreakdown | null;
  stability: Pick<StabilityStatementProps, "children" | "container" | "kind">;
  actions: Omit<ActionStripProps, "className" | "onAction"> | null;
  confirmed: {
    title: string;
    rows: readonly FinancialRowProps[];
  } | null;
  expected: {
    title: string;
    rows: readonly FinancialRowProps[];
  } | null;
  risk: InformationBlockProps | null;
  information: InformationBlockProps;
}
