import type { ActionStripProps } from "../../../design-system/composites/ActionStrip";
import type { AttentionBannerProps } from "../../../design-system/composites/AttentionBanner";
import type { FinancialRowProps } from "../../../design-system/composites/FinancialRow";
import type { HeroProps } from "../../../design-system/composites/Hero";
import type { InformationBlockProps } from "../../../design-system/composites/InformationBlock";
import type { ReserveBlockProps } from "../../../design-system/composites/ReserveBlock";
import type { StabilityStatementProps } from "../../../design-system/composites/StabilityStatement";
import type { SystemRailProps } from "../../../design-system/composites/SystemRail";
import type { EvidenceBreakdown } from "../../evidence/model";

export interface NowViewModel {
  rail: Pick<SystemRailProps, "items" | "state" | "wrap">;
  banner: Omit<AttentionBannerProps, "className" | "onAction"> | null;
  hero: HeroProps;
  evidence: EvidenceBreakdown | null;
  stability: Pick<StabilityStatementProps, "children" | "container" | "kind">;
  actions: Omit<ActionStripProps, "className" | "onAction">;
  position: {
    title: string;
    rows: readonly FinancialRowProps[];
  };
  accounts?: readonly {
    id: string;
    name: string;
    type: string;
    balance: string;
    balancePrefix: string;
    state: "stable" | "attention";
  }[];
  trend?: readonly {
    month: string;
    label: string;
    income: string;
    expense: string;
    net: string;
    netPrefix: string;
    netState: "positive" | "negative" | "neutral";
    incomePercent: number;
    expensePercent: number;
  }[];
  operational?: readonly {
    title: string;
    actionLabel: string;
    actionHref: string;
    rows: readonly FinancialRowProps[];
  }[];
  reserve: ReserveBlockProps | null;
  information: InformationBlockProps;
}
