import type { NumericValueProps } from "../../../design-system/primitives/NumericValue";
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
}
