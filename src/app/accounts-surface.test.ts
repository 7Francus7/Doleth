import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("V2 Cut 4 accounts surface", () => {
  it("deriva saldo de inicial más ledger vigente", () => {
    const data = read("../lib/finance/data.ts");
    expect(data).toContain("initialBalanceCents: account.initialBalanceCents");
    expect(data).toContain("account.initialBalanceCents + (totalsByAccount.get(account.id) ?? 0n)");
    expect(data).toContain("transaction: { voidedAt: null }");
  });

  it("detalle y lista conectan con Movimientos por accountId", () => {
    expect(read("../features/accounts/AccountDetail.tsx")).toContain("/movimientos?accountId=${account.id}");
    expect(read("../features/accounts/AccountsPage.tsx")).toContain("/cuentas/${account.id}");
  });

  it("edición no escribe tipo, moneda ni saldo inicial", () => {
    const action = read("./actions/finance.ts");
    const start = action.indexOf("export async function updateAccountMetadataAction");
    const end = action.indexOf("interface MovementAccount", start);
    const edit = action.slice(start, end);
    expect(edit).toContain("data: { name }");
    expect(edit).not.toContain("initialBalanceCents");
    expect(edit).not.toContain("currency:");
    expect(edit).not.toContain("type:");
  });

  it("crear cuenta mantiene campos de tarjeta condicionales", () => {
    const form = read("../components/finance/AccountForm.tsx");
    expect(form).toContain("liability ? (");
    expect(form).toContain('name="closingDay"');
    expect(form).toContain('name="initialBalance"');
  });
});
