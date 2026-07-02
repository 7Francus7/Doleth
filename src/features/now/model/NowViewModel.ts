import type { ActionStripProps } from "../../../design-system/composites/ActionStrip";
import type { FinancialRowProps } from "../../../design-system/composites/FinancialRow";
import type { HeroProps } from "../../../design-system/composites/Hero";
import type { InformationBlockProps } from "../../../design-system/composites/InformationBlock";
import type { ReserveBlockProps } from "../../../design-system/composites/ReserveBlock";
import type { StabilityStatementProps } from "../../../design-system/composites/StabilityStatement";
import type { SystemRailProps } from "../../../design-system/composites/SystemRail";

export interface NowViewModel {
  rail: Pick<SystemRailProps, "items" | "state" | "wrap">;
  hero: HeroProps;
  stability: Pick<StabilityStatementProps, "children" | "container" | "kind">;
  actions: Omit<ActionStripProps, "className" | "onAction">;
  position: {
    title: string;
    rows: readonly FinancialRowProps[];
  };
  reserve: ReserveBlockProps | null;
  information: InformationBlockProps;
}
