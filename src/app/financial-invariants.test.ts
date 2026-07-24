import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  applyPostings,
  createPostings,
  reversePostings,
  summarizeMonth,
} from "../lib/finance/domain";
import {
  accountsMoneyCents,
  patrimonyCents,
  type ProjectionAccount,
} from "../lib/finance/projection";

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

// ---------------------------------------------------------------------------
// Invariantes contables que toda superficie hereda del ledger. No pertenecen a
// /ahora ni a /proximo: las dos leen el mismo patrimonio y deben coincidir.
// ---------------------------------------------------------------------------

describe("ledger: el patrimonio se comporta igual para todas las superficies", () => {
  const accounts = (balances: Record<string, bigint>, archived: string[] = []): ProjectionAccount[] =>
    Object.entries(balances).map(([id, balanceCents]) => ({
      id,
      name: id,
      balanceCents,
      archived: archived.includes(id),
    }));

  it("una transferencia interna no altera el patrimonio", () => {
    const initial = { banco: 300_000_00n, billetera: 100_000_00n };
    const after = applyPostings(initial, createPostings("TRANSFER", 50_000_00n, "banco", "billetera"));
    expect(patrimonyCents(accounts(after))).toBe(patrimonyCents(accounts(initial)));
  });

  it("un movimiento anulado deja el patrimonio como estaba", () => {
    const initial = { banco: 300_000_00n };
    const postings = createPostings("EXPENSE", 24_300_00n, "banco");
    const after = applyPostings(initial, postings);
    const voided = applyPostings(after, reversePostings(postings));
    expect(patrimonyCents(accounts(voided))).toBe(patrimonyCents(accounts(initial)));
  });

  it("una corrección no se cuenta dos veces: solo pesa el reemplazo", () => {
    const original = createPostings("EXPENSE", 24_300_00n, "banco");
    const replacement = createPostings("EXPENSE", 18_000_00n, "banco");
    let balances = applyPostings({ banco: 300_000_00n }, original);
    balances = applyPostings(balances, reversePostings(original)); // el original queda anulado
    balances = applyPostings(balances, replacement);
    expect(patrimonyCents(accounts(balances))).toBe(300_000_00n - 18_000_00n);
  });

  it("los totales del mes ignoran anulados y transferencias", () => {
    const totals = summarizeMonth([
      { type: "INCOME", amountCents: 310_000_00n, voidedAt: null },
      { type: "EXPENSE", amountCents: 24_300_00n, voidedAt: null },
      { type: "EXPENSE", amountCents: 99_000_00n, voidedAt: new Date() },
      { type: "TRANSFER", amountCents: 50_000_00n, voidedAt: null },
    ]);
    expect(totals.incomeCents).toBe(310_000_00n);
    expect(totals.expenseCents).toBe(24_300_00n);
    expect(totals.balanceCents).toBe(285_700_00n);
  });

  it("el dinero en cuentas excluye archivadas y el patrimonio no", () => {
    const list = accounts({ banco: 300_000_00n, viejo: 40_000_00n }, ["viejo"]);
    expect(accountsMoneyCents(list)).toBe(300_000_00n);
    expect(patrimonyCents(list)).toBe(340_000_00n);
  });
});

// ---------------------------------------------------------------------------
// Copy transversal: las dos superficies hablan el mismo castellano.
// ---------------------------------------------------------------------------

describe("copy financiero: castellano consistente, sin jerga importada", () => {
  const surfaces = [
    read("src/features/now/data/getNowModel.ts"),
    read("src/features/next/data/getNextModel.ts"),
    read("src/features/now/NowPage.tsx"),
    read("src/features/next/NextPage.tsx"),
  ];
  const banned = [
    "cashflow",
    "cash flow",
    "forecast",
    "outstanding",
    "liability",
    "budget remaining",
    "coverage ratio",
  ];

  for (const term of banned) {
    it(`no usa "${term}"`, () => {
      for (const source of surfaces) {
        expect(source.toLowerCase()).not.toContain(term);
      }
    });
  }
});
