import { describe, expect, it } from "vitest";
import {
  computeReality,
  coverageRatio,
  isDuplicateWithinWindow,
  reconcileCoverage,
  resilientList,
  selectRecommendation,
  signedPatrimonyEffect,
  type AnalysisMovement,
  type ActPayment,
} from "./analysis";

const movement = (over: Partial<AnalysisMovement> & { id: string }): AnalysisMovement => ({
  type: "EXPENSE",
  amountCents: 0n,
  occurredOn: "2026-07-20",
  voided: false,
  label: "Movimiento",
  accountName: "Cuenta principal",
  ...over,
});

describe("coverageRatio", () => {
  it("sin compromiso: 100", () => {
    expect(coverageRatio(0n, 0n)).toBe(100);
  });
  it("cubierto parcialmente", () => {
    expect(coverageRatio(50_000_00n, 100_000_00n)).toBe(50);
  });
  it("nunca supera 100 ni baja de 0", () => {
    expect(coverageRatio(300_000_00n, 100_000_00n)).toBe(100);
    expect(coverageRatio(-5_000_00n, 100_000_00n)).toBe(0);
  });
});

describe("computeReality", () => {
  const account = (over: Partial<import("./analysis").RealityAccount> & { id: string }) => ({
    name: "Cuenta",
    type: "BANK",
    balanceCents: 0n,
    archived: false,
    ...over,
  });

  it("sin cuentas: completitud vacía", () => {
    const result = computeReality({
      accounts: [],
      investments: [],
      committedCents: 0n,
      upcomingCount: 0,
      hasMovements: false,
      hasIncome: false,
    });
    expect(result.patrimonyCents).toBe(0n);
    expect(result.completeness).toBe("empty");
  });

  it("una cuenta: información inicial", () => {
    const result = computeReality({
      accounts: [account({ id: "a", balanceCents: 100_000_00n })],
      investments: [],
      committedCents: 0n,
      upcomingCount: 0,
      hasMovements: false,
      hasIncome: false,
    });
    expect(result.patrimonyCents).toBe(100_000_00n);
    expect(result.activeCount).toBe(1);
    expect(result.completeness).toBe("initial");
  });

  it("cuenta archivada conserva su saldo dentro del patrimonio total", () => {
    const result = computeReality({
      accounts: [
        account({ id: "a", balanceCents: 100_000_00n }),
        account({ id: "b", balanceCents: 40_000_00n, archived: true }),
      ],
      investments: [],
      committedCents: 0n,
      upcomingCount: 0,
      hasMovements: true,
      hasIncome: true,
    });
    expect(result.patrimonyCents).toBe(140_000_00n);
    expect(result.activeCents).toBe(100_000_00n);
    expect(result.archivedCents).toBe(40_000_00n);
    expect(result.archivedCount).toBe(1);
  });

  it("inversiones se contabilizan como dominio separado, no dentro del patrimonio", () => {
    const result = computeReality({
      accounts: [account({ id: "a", balanceCents: 100_000_00n })],
      investments: [{ id: "i", name: "Fondo", currentValueCents: 305_000_00n }],
      committedCents: 0n,
      upcomingCount: 0,
      hasMovements: true,
      hasIncome: true,
    });
    expect(result.patrimonyCents).toBe(100_000_00n);
    expect(result.investedCents).toBe(305_000_00n);
  });

  it("compromisos no se restan del patrimonio", () => {
    const result = computeReality({
      accounts: [account({ id: "a", balanceCents: 100_000_00n })],
      investments: [],
      committedCents: 96_000_00n,
      upcomingCount: 2,
      hasMovements: true,
      hasIncome: true,
    });
    expect(result.patrimonyCents).toBe(100_000_00n);
    expect(result.committedCents).toBe(96_000_00n);
  });

  it("todas las señales cumplidas: información suficiente", () => {
    const result = computeReality({
      accounts: [account({ id: "a", balanceCents: 100_000_00n })],
      investments: [{ id: "i", name: "Fondo", currentValueCents: 10_000_00n }],
      committedCents: 5_000_00n,
      upcomingCount: 1,
      hasMovements: true,
      hasIncome: true,
    });
    expect(result.metSignals).toBe(5);
    expect(result.completeness).toBe("sufficient");
  });

  it("reconciliación: patrimonio = activo + archivado", () => {
    const result = computeReality({
      accounts: [
        account({ id: "a", balanceCents: 33_000_00n }),
        account({ id: "b", balanceCents: -7_000_00n }),
        account({ id: "c", balanceCents: 12_000_00n, archived: true }),
      ],
      investments: [],
      committedCents: 0n,
      upcomingCount: 0,
      hasMovements: true,
      hasIncome: false,
    });
    expect(result.activeCents + result.archivedCents).toBe(result.patrimonyCents);
  });
});

describe("selectRecommendation", () => {
  const payment = (over: Partial<ActPayment> & { id: string }): ActPayment => ({
    concept: "Servicio",
    dueOn: "2026-07-25",
    estimatedCents: 20_000_00n,
    accountName: "Cuenta principal",
    accountBalanceCents: 100_000_00n,
    ...over,
  });

  const ctx = (over: Partial<import("./analysis").ActContext> = {}) => ({
    today: "2026-07-22",
    hasAccounts: true,
    movementCount: 10,
    patrimonyCents: 500_000_00n,
    pendingPayments: [] as ActPayment[],
    ...over,
  });

  it("sin cuentas tiene la máxima prioridad", () => {
    const result = selectRecommendation(ctx({ hasAccounts: false }));
    expect(result.ruleId).toBe("no-accounts");
    expect(result.priority).toBe(1);
  });

  it("pago vencido gana sobre pago próximo sin cobertura", () => {
    const result = selectRecommendation(
      ctx({
        patrimonyCents: 0n,
        pendingPayments: [
          payment({ id: "overdue", dueOn: "2026-07-20", estimatedCents: 10_000_00n }),
          payment({ id: "soon", dueOn: "2026-07-24", estimatedCents: 90_000_00n }),
        ],
      }),
    );
    expect(result.ruleId).toBe("overdue-payment");
    expect(result.payment?.id).toBe("overdue");
    expect(result.hasEvidence).toBe(true);
  });

  it("pago próximo cubierto no dispara recomendación de faltante", () => {
    const result = selectRecommendation(
      ctx({
        patrimonyCents: 500_000_00n,
        pendingPayments: [payment({ id: "soon", dueOn: "2026-07-24", estimatedCents: 20_000_00n })],
      }),
    );
    expect(result.ruleId).toBe("stable");
    expect(result.shortfallCents).toBe(0n);
  });

  it("pago próximo sin cobertura: faltante = compromiso − patrimonio", () => {
    const result = selectRecommendation(
      ctx({
        patrimonyCents: 30_000_00n,
        pendingPayments: [payment({ id: "soon", dueOn: "2026-07-24", estimatedCents: 90_000_00n })],
      }),
    );
    expect(result.ruleId).toBe("uncovered-upcoming");
    expect(result.commitmentCents).toBe(90_000_00n);
    expect(result.coverageCents).toBe(30_000_00n);
    expect(result.shortfallCents).toBe(60_000_00n);
  });

  it("sin movimientos (con cuentas) recomienda registrar", () => {
    const result = selectRecommendation(ctx({ movementCount: 0 }));
    expect(result.ruleId).toBe("no-movements");
  });

  it("estado estable cuando no hay nada urgente", () => {
    const result = selectRecommendation(ctx());
    expect(result.ruleId).toBe("stable");
    expect(result.priority).toBe(5);
  });

  it("la evidencia de faltante reconcilia: compromiso − cobertura = faltante", () => {
    const result = selectRecommendation(
      ctx({
        patrimonyCents: 30_000_00n,
        pendingPayments: [payment({ id: "soon", dueOn: "2026-07-24", estimatedCents: 90_000_00n })],
      }),
    );
    expect(result.commitmentCents - result.coverageCents).toBe(result.shortfallCents);
  });
});

describe("signedPatrimonyEffect", () => {
  it("transferencia no tiene efecto patrimonial", () => {
    expect(signedPatrimonyEffect(movement({ id: "t", type: "TRANSFER", amountCents: 9n }))).toBe(0n);
  });
});

describe("reconcileCoverage", () => {
  it("cobertura acotada al compromiso: nunca faltante negativo", () => {
    const result = reconcileCoverage(90_000_00n, 30_000_00n);
    expect(result.coverageCents).toBe(30_000_00n);
    expect(result.missingCents).toBe(60_000_00n);
  });
  it("cobertura mayor al compromiso se acota y faltante = 0", () => {
    const result = reconcileCoverage(20_000_00n, 500_000_00n);
    expect(result.coverageCents).toBe(20_000_00n);
    expect(result.missingCents).toBe(0n);
  });
  it("cobertura negativa se trata como cero", () => {
    const result = reconcileCoverage(10_000_00n, -5n);
    expect(result.coverageCents).toBe(0n);
    expect(result.missingCents).toBe(10_000_00n);
  });
  it("siempre reconcilia: compromiso − cobertura = faltante", () => {
    const result = reconcileCoverage(77_777_00n, 12_345_00n);
    expect(77_777_00n - result.coverageCents).toBe(result.missingCents);
  });
});

describe("resilientList", () => {
  it("devuelve los valores cuando la lectura resuelve", async () => {
    const result = await resilientList(async () => [1, 2, 3]);
    expect(result).toEqual([1, 2, 3]);
  });
  it("degrada a lista vacía cuando la lectura falla (no propaga el error)", async () => {
    const result = await resilientList<number>(async () => {
      throw new Error("conexión caída");
    });
    expect(result).toEqual([]);
  });
});

describe("isDuplicateWithinWindow", () => {
  it("dentro de la ventana: es duplicado", () => {
    expect(isDuplicateWithinWindow(1_000, 30_000, 60_000)).toBe(true);
  });
  it("fuera de la ventana: no es duplicado", () => {
    expect(isDuplicateWithinWindow(1_000, 90_000, 60_000)).toBe(false);
  });
  it("timestamps invertidos no cuentan como duplicado", () => {
    expect(isDuplicateWithinWindow(90_000, 1_000, 60_000)).toBe(false);
  });
});
