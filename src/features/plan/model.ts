import { formatCents } from "../../lib/finance/domain";
import { addCivilDays, compareCommitments, groupForDueDate, type UpcomingCommitment } from "../../lib/finance/projection";
import { describeDueDateAR, describeGroup } from "../../lib/finance/upcomingDate";

export type PlanHorizon = 7 | 30 | 90;

export interface PlanPayment {
  id: string; concept: string; dueLabel: string; accountName: string; frequency: string | null;
  currency: string; amount: string; state: "OVERDUE" | "TODAY" | "PENDING"; href: string;
}

export interface PlanModel {
  horizon: PlanHorizon;
  horizonEnd: string;
  totals: { currency: string; amount: string }[];
  groups: { id: string; title: string; payments: PlanPayment[] }[];
  confirmed: { id: string; concept: string; dueLabel: string; accountName: string; currency: string; amount: string; href: string }[];
  restorationKey: string;
}

const money = (cents: bigint) => formatCents(cents < 0n ? -cents : cents);

export function normalizePlanHorizon(value: string | undefined): PlanHorizon {
  return value === "7" ? 7 : value === "90" ? 90 : 30;
}

export function buildPlanModel(input: {
  today: string; horizon: PlanHorizon; pending: UpcomingCommitment[];
  paid: { id: string; concept: string; dueOn: string; amountCents: bigint; accountName: string; currency: string; transactionId: string | null }[];
}): PlanModel {
  const horizonEnd = addCivilDays(input.today, input.horizon);
  const included = [...input.pending]
    .filter((payment) => payment.dueOn <= horizonEnd)
    .sort(compareCommitments);
  const totals = new Map<string, bigint>();
  for (const payment of included) {
    const currency = payment.currency || "ARS";
    totals.set(currency, (totals.get(currency) ?? 0n) + payment.amountCents);
  }
  const groups = new Map<string, PlanPayment[]>();
  for (const payment of included) {
    const id = groupForDueDate(payment.dueOn, input.today);
    const list = groups.get(id) ?? [];
    list.push({
      id: payment.id,
      concept: payment.concept,
      dueLabel: describeDueDateAR(payment.dueOn, input.today),
      accountName: payment.accountName,
      frequency: payment.frequency,
      currency: payment.currency || "ARS",
      amount: money(payment.amountCents),
      state: payment.dueOn < input.today ? "OVERDUE" : payment.dueOn === input.today ? "TODAY" : "PENDING",
      href: `/proximo/${payment.id}?volver=${encodeURIComponent(`/proximo?horizon=${input.horizon}`)}`,
    });
    groups.set(id, list);
  }
  return {
    horizon: input.horizon,
    horizonEnd,
    totals: [...totals].sort(([a], [b]) => a.localeCompare(b)).map(([currency, cents]) => ({ currency, amount: money(cents) })),
    groups: [...groups].map(([id, payments]) => ({ id, title: describeGroup(id as Parameters<typeof describeGroup>[0], input.today), payments })),
    confirmed: input.paid.map((payment) => ({
      id: payment.id, concept: payment.concept, dueLabel: describeDueDateAR(payment.dueOn, input.today),
      accountName: payment.accountName, currency: payment.currency, amount: money(payment.amountCents), href: `/proximo/${payment.id}?volver=${encodeURIComponent(`/proximo?horizon=${input.horizon}`)}`,
    })),
    restorationKey: `/proximo?horizon=${input.horizon}`,
  };
}
