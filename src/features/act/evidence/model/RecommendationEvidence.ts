export interface RecommendationEvidenceLine {
  id: string;
  label: string;
  amount: number;
  displayValue: string;
  valuePrefix: string;
}

export interface RecommendationEvidence {
  title: string;
  subtitle: string;
  priorityLabel: string;
  priorityReason: string;
  lines: readonly [RecommendationEvidenceLine, RecommendationEvidenceLine];
  missing: RecommendationEvidenceLine;
  dateLabel: string;
  dateValue: string;
  waitLabel: string;
  waitConsequence: string;
}

export function validateRecommendationEvidence(
  evidence: RecommendationEvidence,
  expectedDisplayValue: string,
): RecommendationEvidence {
  const [commitment, assignedCoverage] = evidence.lines;
  const reconciledMissing = commitment.amount - assignedCoverage.amount;

  if (reconciledMissing !== evidence.missing.amount) {
    throw new Error("Recommendation evidence does not reconcile its missing amount.");
  }

  if (evidence.missing.displayValue !== expectedDisplayValue) {
    throw new Error("Recommendation evidence does not match the visible recommendation amount.");
  }

  return evidence;
}
