import type { ActionStripProps } from "../../../design-system/composites/ActionStrip";
import type { AttentionBannerProps } from "../../../design-system/composites/AttentionBanner";
import type { CoverageMeterProps } from "../../../design-system/composites/CoverageMeter";
import type { FinancialRowProps } from "../../../design-system/composites/FinancialRow";
import type { HeroProps } from "../../../design-system/composites/Hero";
import type { InformationBlockProps } from "../../../design-system/composites/InformationBlock";
import type { StabilityStatementProps } from "../../../design-system/composites/StabilityStatement";
import type { SystemRailProps } from "../../../design-system/composites/SystemRail";
import type { EvidenceBreakdown } from "../../evidence/model";

export interface ProgressViewModel {
  rail: Pick<SystemRailProps, "items" | "state" | "wrap">;
  banner: Omit<AttentionBannerProps, "className" | "onAction"> | null;
  hero: HeroProps;
  evidence: EvidenceBreakdown | null;
  comparison: {
    title: string;
    supportingLine: string;
    rows: readonly [FinancialRowProps, FinancialRowProps];
    summary: string;
    summaryKind: NonNullable<StabilityStatementProps["kind"]>;
    actionLabel?: string;
    actionHref?: string;
  };
  stability: Pick<StabilityStatementProps, "children" | "container" | "kind">;
  actions: Omit<ActionStripProps, "className" | "onAction"> | null;
  goals: {
    title: string;
    supportingLine: string;
    meters: readonly CoverageMeterProps[];
  } | null;
  missing: InformationBlockProps | null;
  information: InformationBlockProps;
}
