import { describe, expect, it } from "vitest";
import type { UpcomingCommitment } from "../../lib/finance/projection";
import { buildPlanModel, normalizePlanHorizon } from "./model";

const payment = (overrides: Partial<UpcomingCommitment> = {}): UpcomingCommitment => ({
  id: "payment-1",
  concept: "Alquiler",
  dueOn: "2026-08-20",
  amountCents: 450_000_00n,
  accountId: "account-1",
  accountName: "Banco",
  accountBalanceCents: 900_000_00n,
  currency: "ARS",
  frequency: "Mensual",
  createdAtMs: 1,
  ...overrides,
});

describe("Plan", () => {
  it("normaliza el horizonte sin aceptar valores arbitrarios", () => {
    expect(normalizePlanHorizon("7")).toBe(7);
    expect(normalizePlanHorizon("90")).toBe(90);
    expect(normalizePlanHorizon("365")).toBe(30);
    expect(normalizePlanHorizon(undefined)).toBe(30);
  });

  it("incluye vencidos y excluye compromisos posteriores al horizonte", () => {
    const model = buildPlanModel({
      today: "2026-08-13",
      horizon: 7,
      pending: [
        payment({ id: "overdue", dueOn: "2026-08-10" }),
        payment({ id: "inside", dueOn: "2026-08-20" }),
        payment({ id: "outside", dueOn: "2026-08-21" }),
      ],
      paid: [],
    });
    const rows = model.groups.flatMap((group) => group.payments);
    expect(rows.map((row) => row.id)).toEqual(["overdue", "inside"]);
    expect(rows[0]?.state).toBe("OVERDUE");
  });

  it("mantiene totales separados por moneda y marca hoy", () => {
    const model = buildPlanModel({
      today: "2026-08-13",
      horizon: 30,
      pending: [
        payment({ id: "ars", dueOn: "2026-08-13", amountCents: 100_00n }),
        payment({ id: "usd", currency: "USD", amountCents: 25_00n }),
      ],
      paid: [],
    });
    expect(model.totals).toEqual([
      { currency: "ARS", amount: "100" },
      { currency: "USD", amount: "25" },
    ]);
    expect(model.groups.flatMap((group) => group.payments).find((row) => row.id === "ars")?.state).toBe("TODAY");
  });

  it("presenta lo confirmado como historia y conserva su moneda", () => {
    const model = buildPlanModel({
      today: "2026-08-13",
      horizon: 30,
      pending: [],
      paid: [{ id: "paid", concept: "Seguro", dueOn: "2026-08-12", amountCents: 80_00n, accountName: "Caja USD", currency: "USD", transactionId: "tx-1" }],
    });
    expect(model.confirmed[0]).toMatchObject({ id: "paid", currency: "USD", amount: "80" });
  });
});
