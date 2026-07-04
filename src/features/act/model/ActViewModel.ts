import type { NumericValueProps } from "../../../design-system/primitives/NumericValue";
import type { FinancialRowProps } from "../../../design-system/composites/FinancialRow";
import type { SystemRailProps } from "../../../design-system/composites/SystemRail";
import type { RecommendationEvidence } from "../evidence/model";

export type ActDecisionState =
  | "idle"
  | "confirming"
  | "confirmed"
  | "deferred"
  | "dismissed";
export type ActDecisionOutcomeState = Exclude<ActDecisionState, "idle" | "confirming">;

export interface ActDecisionOutcome {
  label: string;
  title: string;
  detail: string;
  resetLabel: string;
}

export interface ActDecisionConfirmationDetail {
  label: string;
  value: string;
}

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
    evidenceTriggerLabel: string;
  };
  evidence: RecommendationEvidence;
  reason: string;
  impact: {
    title: string;
    rows: readonly [FinancialRowProps, FinancialRowProps];
  };
  decision: {
    label: string;
    helper: string;
    primaryActionLabel: string;
    confirmation: {
      label: string;
      helper: string;
      amountLabel: string;
      amount: Pick<
        NumericValueProps,
        "format" | "prefix" | "size" | "state" | "tone" | "value"
      >;
      details: readonly [
        ActDecisionConfirmationDetail,
        ActDecisionConfirmationDetail,
        ActDecisionConfirmationDetail,
        ActDecisionConfirmationDetail,
        ActDecisionConfirmationDetail,
      ];
      primaryActionLabel: string;
      secondaryActionLabel: string;
    };
    secondaryActions: readonly [
      { id: "deferred"; label: string },
      { id: "dismissed"; label: string },
    ];
    outcomes: Record<ActDecisionOutcomeState, ActDecisionOutcome>;
  };
}
