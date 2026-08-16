import { describe, expect, it } from "vitest";
import { buildPatrimonyModel, type PatrimonyAccountInput, type PatrimonyInvestmentInput } from "./model";

const account = (id: string, overrides: Partial<PatrimonyAccountInput> = {}): PatrimonyAccountInput => ({
  id, name: id, type: "BANK", currency: "ARS", status: "ACTIVE", liability: false,
  originalCents: 100_00n, valuedCents: 100_00n, ...overrides,
});
const investment = (id: string, overrides: Partial<PatrimonyInvestmentInput> = {}): PatrimonyInvestmentInput => ({
  id, name: id, kind: "STOCKS", symbol: "AAPL", currency: "ARS", investedCents: 100_00n,
  valueCents: 120_00n, convertedInvestedCents: 100_00n, convertedValueCents: 120_00n,
  quantity: "1", note: null, status: "ACTIVE", mode: "market", priceProvider: "test", priceAsOf: "2026-08-13", ...overrides,
});
const model = (accounts: PatrimonyAccountInput[], investments: PatrimonyInvestmentInput[] = [], overrides = {}) => buildPatrimonyModel({
  displayCurrency: "ARS", displaySymbol: "$", accountsComplete: true, investmentsComplete: true,
  investedBasisComplete: true, accounts, investments, ...overrides,
});

describe("patrimony model", () => {
  it("expone una fórmula exhaustiva y resta la deuda con su signo real", () => {
    const result = model([
      account("bank", { valuedCents: 500_00n }),
      account("saving", { type: "SAVINGS", valuedCents: 200_00n }),
      account("other", { type: "OTHER", valuedCents: 50_00n }),
      account("old", { status: "ARCHIVED", valuedCents: 25_00n }),
      account("card", { type: "CREDIT_CARD", liability: true, valuedCents: -100_00n }),
    ]);
    expect(result.patrimonyCents).toBe(675_00n);
    expect(result.formula.reduce((sum, part) => sum + part.cents, 0n)).toBe(result.patrimonyCents);
    expect(result.formula.find((part) => part.id === "debt")?.cents).toBe(-100_00n);
  });

  it("excluye inversiones archivadas del total activo", () => {
    const result = model([], [investment("active"), investment("old", { status: "ARCHIVED", convertedValueCents: 999_00n })]);
    expect(result.investmentTotalCents).toBe(120_00n);
    expect(result.investments).toHaveLength(1);
    expect(result.archivedInvestments).toHaveLength(1);
  });

  it("no publica rendimiento agregado cuando falta conversión multimoneda", () => {
    const result = model([], [investment("usd", { currency: "USD" })], { investmentsComplete: false });
    expect(result.investmentPerformance).toBeNull();
    expect(result.investmentNativeTotals).toEqual([{ currency: "USD", cents: 120_00n }]);
  });

  it("evita porcentajes infinitos con aporte cero", () => {
    const result = model([], [investment("gift", { investedCents: 0n, convertedInvestedCents: 0n })]);
    expect(result.investments[0]?.returnLabel).toBeNull();
    expect(result.investmentPerformance?.returnLabel).toBe("Sin porcentaje");
  });

  it("hace explícita una cotización faltante", () => {
    const result = model([], [investment("missing", { mode: "declared", priceProvider: null, priceAsOf: null })]);
    expect(result.investments[0]?.source).toContain("Sin cotización de AAPL");
  });
});
