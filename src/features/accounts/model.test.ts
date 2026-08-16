import { describe, expect, it } from "vitest";
import { buildAccountsViewModel } from "./model";

const account = (type: "CASH" | "BANK" | "WALLET" | "SAVINGS" | "CREDIT_CARD", originalCents: bigint, valuedCents = originalCents) => ({ id: type, name: type, type, currency: "ARS", status: "ACTIVE" as const, liability: type === "CREDIT_CARD", originalCents, valuedCents });

describe("accounts model", () => {
  it("separa disponible, ahorro y deuda", () => {
    const model = buildAccountsViewModel({ displayCurrency: "ARS", displaySymbol: "$", complete: true, accounts: [account("BANK", 100n), account("SAVINGS", 50n), account("CREDIT_CARD", -30n)] });
    expect(model.availableCents).toBe(100n);
    expect(model.savingsCents).toBe(50n);
    expect(model.debtCents).toBe(-30n);
  });

  it("no mezcla monedas en subtotales originales", () => {
    const usd = { ...account("WALLET", 200_00n), id: "usd", currency: "USD", valuedCents: 280_000_00n };
    const model = buildAccountsViewModel({ displayCurrency: "ARS", displaySymbol: "$", complete: true, accounts: [account("BANK", 500_000_00n), usd] });
    expect(model.currencyTotals.map((total) => total.currency)).toEqual(["ARS", "USD"]);
  });

  it("excluye archivadas de totales sin ocultarlas", () => {
    const archived = { ...account("BANK", 100n), status: "ARCHIVED" as const };
    const model = buildAccountsViewModel({ displayCurrency: "ARS", displaySymbol: "$", complete: true, accounts: [archived] });
    expect(model.availableCents).toBe(0n);
    expect(model.accounts).toHaveLength(1);
  });
});
