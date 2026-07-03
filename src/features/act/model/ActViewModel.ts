import type { NumericValueProps } from "../../../design-system/primitives/NumericValue";
import type { FinancialRowProps } from "../../../design-system/composites/FinancialRow";
import type { SystemRailProps } from "../../../design-system/composites/SystemRail";

export interface ActViewModel {
  navigation: {
    backHref: string;
    backLabel: string;
    title: string;
  };
  rail: Pick<SystemRailProps, "items" | "state" | "wrap">;
  recommendation: {
    stateLabel: string;
    conclusion: string;
    amount: Pick<
      NumericValueProps,
      "format" | "prefix" | "size" | "state" | "tone" | "value"
    >;
    consequence: string;
    confidenceLabel: string;
  };
  reason: string;
  impact: {
    title: string;
    rows: readonly [FinancialRowProps, FinancialRowProps];
  };
  decision: {
    primaryLabel: string;
    secondaryActions: readonly [
      { href: string; label: string },
      { href: string; label: string },
    ];
  };
}
