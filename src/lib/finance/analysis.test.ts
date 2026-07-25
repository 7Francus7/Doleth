import { describe, expect, it } from "vitest";
import {
  coverageRatio,
  isDuplicateWithinWindow,
  reconcileCoverage,
  resilientList,
  resilientRead,
  selectRecommendation,
  signedPatrimonyEffect,
  type AnalysisMovement,
  type ActPayment,
} from "./analysis";

// La composición de /mi-realidad se prueba en `reality.test.ts`, y el cierre
// mensual en `close.test.ts`: acá quedan las reglas compartidas del ledger.

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

describe("resilientRead", () => {
  it("devuelve el valor cuando la lectura resuelve", async () => {
    expect(await resilientRead(async () => ({ ok: true }))).toEqual({ ok: true });
  });

  it("distingue 'falló' de 'está vacío': un error da null, no una lista vacía", async () => {
    const result = await resilientRead<number[]>(async () => {
      throw new Error("conexión caída");
    });
    expect(result).toBeNull();
  });

  it("una lista vacía sigue siendo una lista vacía, no un fallo", async () => {
    expect(await resilientRead(async () => [])).toEqual([]);
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
