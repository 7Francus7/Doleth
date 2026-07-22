import type { AllocationSegment } from "../../../design-system/composites/AllocationChart";

export type InvestmentTone = "positive" | "negative" | "neutral";

export interface InvestmentHolding {
  id: string;
  name: string;
  kindLabel: string;
  value: string;
  valuePrefix: string;
  invested: string;
  deltaLabel: string;
  deltaState: InvestmentTone;
}

export interface InvestmentsViewModel {
  hasInvestments: boolean;
  stateText: string;
  total: {
    value: string;
    valuePrefix: string;
    label: string;
  };
  performance: {
    invested: string;
    gain: string;
    gainPrefix: string;
    gainPercentLabel: string;
    state: InvestmentTone;
  } | null;
  segments: readonly AllocationSegment[];
  holdings: readonly InvestmentHolding[];
  stability: string;
}
