import type { SystemRailItems } from "../../../../design-system/composites/SystemRail";

export interface EvidenceBreakdownLine {
  id: string;
  label: string;
  amount: number | null;
  displayValue: string;
  valuePrefix: string;
  sign?: "+" | "-";
  status?: "confirmed" | "missing";
}

export interface EvidenceBreakdown {
  status: "complete" | "partial";
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
  if (breakdown.total.displayValue !== expectedDisplayValue) {
    throw new Error("Evidence total does not match the visible Hero value.");
  }

  const missingLines = breakdown.lines.filter((line) => line.amount === null);

  if (breakdown.status === "partial") {
    if (missingLines.length === 0) {
      throw new Error("Partial evidence requires at least one missing line.");
    }

    return breakdown;
  }

  if (missingLines.length > 0) {
    throw new Error("Complete evidence cannot contain missing lines.");
  }

  const reconciledAmount = breakdown.lines.reduce(
    (total, line) => total + (line.amount ?? 0),
    0,
  );

  if (reconciledAmount !== breakdown.total.amount) {
    throw new Error("Evidence breakdown does not reconcile with its total.");
  }

  return breakdown;
}
