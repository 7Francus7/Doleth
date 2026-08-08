import { describe, expect, it } from "vitest";
import {
  applyPostings,
  createPostings,
  formatDateAR,
  monthBounds,
  idempotencyDecision,
  paymentConversionDecision,
  requirePositiveMoney,
  reversePostings,
  summarizeMonth,
  todayInArgentina,
} from "./domain";

describe("invariantes contables", () => {
  it("gasto reduce saldo", () => {
    const result = applyPostings({ cash: 10_000n }, createPostings("EXPENSE", 2_500n, "cash"));
    expect(result.cash).toBe(7_500n);
  });

  it("ingreso aumenta saldo", () => {
    const result = applyPostings({ bank: 10_000n }, createPostings("INCOME", 2_500n, "bank"));
    expect(result.bank).toBe(12_500n);
  });

  it("transferencia conserva patrimonio total", () => {
    const postings = createPostings("TRANSFER", 3_000n, "bank", "cash");
    const before = { bank: 10_000n, cash: 1_000n };
    const after = applyPostings(before, postings);
    expect(after).toEqual({ bank: 7_000n, cash: 4_000n });
    expect(Object.values(after).reduce((sum, value) => sum + value, 0n)).toBe(11_000n);
  });

  /**
   * Una transferencia entre monedas distintas no conserva el número: conserva el
   * valor. Salen 140.000 pesos y entran 100 dólares, y cada asiento queda
   * expresado en la moneda de su cuenta. Sumar los dos números sin convertirlos
   * no significaría nada, y por eso el patrimonio de un ledger multimoneda se
   * calcula valuando, no sumando.
   */
  it("transferencia entre monedas acredita el importe de destino", () => {
    const postings = createPostings("TRANSFER", 14_000_000n, "pesos", "dolares", 10_000n);
    const after = applyPostings({ pesos: 20_000_000n, dolares: 0n }, postings);
    expect(after).toEqual({ pesos: 6_000_000n, dolares: 10_000n });
  });

  it("sin importe de destino, la transferencia acredita lo mismo que sale", () => {
    expect(createPostings("TRANSFER", 3_000n, "bank", "cash")).toEqual([
      { accountId: "bank", amountCents: -3_000n },
      { accountId: "cash", amountCents: 3_000n },
    ]);
  });

  it("un gasto no puede acreditar un importe en destino", () => {
    expect(() => createPostings("EXPENSE", 100n, "cash", undefined, 50n)).toThrow();
    expect(() => createPostings("INCOME", 100n, "cash", undefined, 50n)).toThrow();
  });

  it("el importe acreditado tiene que ser positivo", () => {
    expect(() => createPostings("TRANSFER", 100n, "bank", "cash", 0n)).toThrow();
    expect(() => createPostings("TRANSFER", 100n, "bank", "cash", -50n)).toThrow();
  });

  it("la anulación de una transferencia entre monedas devuelve cada cuenta a su lugar", () => {
    const postings = createPostings("TRANSFER", 14_000_000n, "pesos", "dolares", 10_000n);
    const before = { pesos: 20_000_000n, dolares: 500n };
    const after = applyPostings(before, postings);
    expect(applyPostings(after, reversePostings(postings))).toEqual(before);
  });

  it.each(["0", "-1"])("rechaza importe no positivo: %s", (value) => {
    expect(() => requirePositiveMoney(value)).toThrow();
  });

  it("rechaza transferencia a misma cuenta", () => {
    expect(() => createPostings("TRANSFER", 100n, "bank", "bank")).toThrow();
  });

  it("anulación restaura efecto", () => {
    const posting = createPostings("EXPENSE", 2_000n, "cash");
    const changed = applyPostings({ cash: 5_000n }, posting);
    expect(applyPostings(changed, reversePostings(posting)).cash).toBe(5_000n);
  });

  it("envío duplicado devuelve movimiento existente", () => {
    expect(idempotencyDecision("tx_1")).toBe("RETURN_EXISTING");
    expect(idempotencyDecision(null)).toBe("CREATE");
  });

  it("pago ya convertido no crea otro gasto", () => {
    expect(paymentConversionDecision("PAID", "tx_1")).toBe("RETURN_EXISTING");
    expect(paymentConversionDecision("PENDING", null)).toBe("CREATE");
  });

  it("totales mensuales excluyen anulados y transferencias", () => {
    expect(summarizeMonth([
      { type: "INCOME", amountCents: 10_000n, voidedAt: null },
      { type: "EXPENSE", amountCents: 2_000n, voidedAt: null },
      { type: "EXPENSE", amountCents: 7_000n, voidedAt: new Date() },
      { type: "TRANSFER", amountCents: 4_000n, voidedAt: null },
    ])).toEqual({ incomeCents: 10_000n, expenseCents: 2_000n, balanceCents: 8_000n });
  });

  it("usa día civil de Argentina", () => {
    expect(todayInArgentina(new Date("2026-07-22T02:30:00.000Z"))).toBe("2026-07-21");
    expect(monthBounds("2026-07")).toEqual({
      start: new Date("2026-07-01T00:00:00.000Z"),
      end: new Date("2026-08-01T00:00:00.000Z"),
    });
  });
  it("muestra fechas en formato local", () => {
    expect(formatDateAR("2026-07-22")).toBe("22/07/2026");
    expect(formatDateAR(new Date("2026-07-22T00:00:00.000Z"))).toBe("22/07/2026");
  });
});
