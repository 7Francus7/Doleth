import { describe, expect, it } from "vitest";
import { formatCents } from "./lib/finance/domain";
import {
  computeChanges,
  reconcileCoverage,
  selectRecommendation,
  type AnalysisMovement,
  type ActPayment,
} from "./lib/finance/analysis";
import { validateEvidenceBreakdown, type EvidenceBreakdown } from "./features/evidence/model";
import {
  validateRecommendationEvidence,
  type RecommendationEvidence,
} from "./features/act/evidence/model";

const money = (cents: bigint): string => formatCents(cents < 0n ? -cents : cents);
const prefix = (cents: bigint): string => (cents < 0n ? "-$" : "$");
const metadata = ["Últimos 7 días", "ARS", "Personal", "Información completa"] as const;

const movement = (over: Partial<AnalysisMovement> & { id: string }): AnalysisMovement => ({
  type: "EXPENSE",
  amountCents: 0n,
  occurredOn: "2026-07-20",
  voided: false,
  label: "Movimiento",
  accountName: "Cuenta",
  ...over,
});

// Construye la evidencia de /cambios igual que getChangesModel y la valida.
function changesEvidence(movements: AnalysisMovement[], patrimony: bigint): EvidenceBreakdown {
  const { causes, netCents } = computeChanges(movements, patrimony);
  return {
    status: "complete",
    title: "Movimientos que explican el cambio",
    subtitle: "Últimos 7 días · no anulados",
    lines: causes.map((cause) => ({
      id: cause.id,
      label: cause.label,
      amount: Number(cause.effectCents),
      displayValue: money(cause.effectCents),
      valuePrefix: "$",
      sign: cause.direction === "in" ? "+" : "-",
      status: "confirmed",
    })),
    total: {
      label: "Cambio neto",
      amount: Number(netCents),
      displayValue: money(netCents),
      valuePrefix: prefix(netCents),
    },
    metadata,
  };
}

describe("/cambios: evidencia reconcilia con el validador real", () => {
  it("mezcla de ingreso y gasto", () => {
    const movements = [
      movement({ id: "a", type: "INCOME", amountCents: 58_000_00n }),
      movement({ id: "b", type: "EXPENSE", amountCents: 21_500_00n }),
    ];
    const net = 58_000_00n - 21_500_00n;
    const evidence = changesEvidence(movements, 400_000_00n);
    expect(() => validateEvidenceBreakdown(evidence, money(net))).not.toThrow();
  });

  it("sin movimientos: evidencia vacía válida y neto 0", () => {
    const evidence = changesEvidence([], 320_000_00n);
    expect(() => validateEvidenceBreakdown(evidence, "0")).not.toThrow();
  });

  it("solo gastos: neto negativo reconcilia", () => {
    const movements = [
      movement({ id: "a", type: "EXPENSE", amountCents: 12_000_00n }),
      movement({ id: "b", type: "EXPENSE", amountCents: 3_500_00n }),
    ];
    const evidence = changesEvidence(movements, 100_000_00n);
    expect(() => validateEvidenceBreakdown(evidence, money(-15_500_00n))).not.toThrow();
  });
});

// Construye la evidencia de /actuar igual que getActModel y la valida.
function actEvidence(
  context: Parameters<typeof selectRecommendation>[0],
): { evidence: RecommendationEvidence; missingCents: bigint } {
  const decision = selectRecommendation(context);
  const { coverageCents, missingCents } = reconcileCoverage(decision.commitmentCents, decision.coverageCents);
  const evidence: RecommendationEvidence = {
    title: "Por qué",
    subtitle: "Detalle",
    priorityLabel: "Prioridad",
    priorityReason: "Motivo",
    lines: [
      {
        id: "commitment",
        label: "Compromiso",
        amount: Number(decision.commitmentCents),
        displayValue: money(decision.commitmentCents),
        valuePrefix: "$",
      },
      {
        id: "coverage",
        label: "Cobertura",
        amount: Number(coverageCents),
        displayValue: money(coverageCents),
        valuePrefix: "$",
      },
    ],
    missing: {
      id: "missing",
      label: "Faltante",
      amount: Number(missingCents),
      displayValue: money(missingCents),
      valuePrefix: "$",
    },
    dateLabel: "Vence",
    dateValue: "22/07/2026",
    waitLabel: "Si esperás",
    waitConsequence: "Consecuencia",
  };
  return { evidence, missingCents };
}

describe("/actuar: evidencia de recomendación reconcilia con el validador real", () => {
  const payment = (over: Partial<ActPayment> & { id: string }): ActPayment => ({
    concept: "Servicio",
    dueOn: "2026-07-24",
    estimatedCents: 90_000_00n,
    accountName: "Cuenta principal",
    accountBalanceCents: 0n,
    ...over,
  });
  const ctx = (over = {}) => ({
    today: "2026-07-22",
    hasAccounts: true,
    movementCount: 10,
    patrimonyCents: 500_000_00n,
    pendingPayments: [] as ActPayment[],
    ...over,
  });

  it("pago próximo sin cobertura", () => {
    const { evidence, missingCents } = actEvidence(
      ctx({ patrimonyCents: 30_000_00n, pendingPayments: [payment({ id: "p" })] }),
    );
    expect(() => validateRecommendationEvidence(evidence, money(missingCents))).not.toThrow();
  });

  it("pago vencido", () => {
    const { evidence, missingCents } = actEvidence(
      ctx({
        patrimonyCents: 0n,
        pendingPayments: [payment({ id: "p", dueOn: "2026-07-20", estimatedCents: 10_000_00n })],
      }),
    );
    expect(() => validateRecommendationEvidence(evidence, money(missingCents))).not.toThrow();
  });

  it("estado estable: faltante 0 reconcilia", () => {
    const { evidence, missingCents } = actEvidence(ctx());
    expect(missingCents).toBe(0n);
    expect(() => validateRecommendationEvidence(evidence, money(missingCents))).not.toThrow();
  });
});
