import type { SystemRailItems } from "../../../../design-system/composites/SystemRail";

export interface HorizonEvidenceLine {
  id: string;
  label: string;
  amount: number | null;
  displayValue: string;
  valuePrefix: string;
  sign?: "+" | "-";
  status?: "confirmed" | "missing";
}

export interface HorizonEvidence {
  status: "complete" | "partial";
  title: string;
  subtitle: string;
  lines: readonly HorizonEvidenceLine[];
  total: {
    label: string;
    amount: number;
    displayValue: string;
    valuePrefix: string;
  };
  metadata: SystemRailItems;
}

export function validateHorizonEvidence(
  evidence: HorizonEvidence,
  expectedDisplayValue: string,
): HorizonEvidence {
  if (evidence.total.displayValue !== expectedDisplayValue) {
    throw new Error("Evidence total does not match the visible Hero value.");
  }

  const missingLines = evidence.lines.filter((line) => line.amount === null);

  if (evidence.status === "partial") {
    if (missingLines.length === 0) {
      throw new Error("Partial evidence requires at least one missing line.");
    }

    return evidence;
  }

  if (missingLines.length > 0) {
    throw new Error("Complete evidence cannot contain missing lines.");
  }

  const reconciledAmount = evidence.lines.reduce((total, line) => total + (line.amount ?? 0), 0);

  if (reconciledAmount !== evidence.total.amount) {
    throw new Error("Evidence breakdown does not reconcile with its total.");
  }

  return evidence;
}
