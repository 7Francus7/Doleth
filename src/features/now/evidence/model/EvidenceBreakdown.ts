import type { SystemRailItems } from "../../../../design-system/composites/SystemRail";

export interface EvidenceBreakdownLine {
  id: string;
  label: string;
  amount: number;
  displayValue: string;
  valuePrefix: string;
  sign?: "+" | "-";
}

export interface EvidenceBreakdown {
  title: string;
  subtitle: string;
  lines: readonly EvidenceBreakdownLine[];
  total: {
    label: string;
    amount: number;
    displayValue: string;
    valuePrefix: string;
  };
  metadata: SystemRailItems;
}

export function validateEvidenceBreakdown(
  breakdown: EvidenceBreakdown,
  expectedDisplayValue: string,
): EvidenceBreakdown {
  const reconciledAmount = breakdown.lines.reduce((total, line) => total + line.amount, 0);

  if (reconciledAmount !== breakdown.total.amount) {
    throw new Error("Evidence breakdown does not reconcile with its total.");
  }

  if (breakdown.total.displayValue !== expectedDisplayValue) {
    throw new Error("Evidence total does not match the visible Hero value.");
  }

  return breakdown;
}
