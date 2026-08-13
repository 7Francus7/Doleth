import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("V2 Cut 3 movements surface", () => {
  it("conecta búsqueda y filtros con lectura server-side paginada", () => {
    const page = read("./movimientos/page.tsx");
    const data = read("../lib/finance/data.ts");
    expect(page).toContain("parseMovementQuery");
    expect(page).toContain("search: query.q");
    expect(data).toContain("MOVEMENTS_PAGE_SIZE = 40");
    expect(data).toContain('contains: search, mode: "insensitive"');
    expect(data).toContain("skip: (page - 1) * MOVEMENTS_PAGE_SIZE");
  });

  it("preserva filtros al entrar al detalle", () => {
    const explorer = read("../features/movements/MovementsExplorer.tsx");
    const detail = read("./movimientos/[id]/page.tsx");
    expect(explorer).toContain("encodeURIComponent(listPath)");
    expect(detail).toContain("sanitizeReturnPath");
    expect(detail).toContain("Volver a movimientos");
  });

  it("Inicio y Cuentas usan accountId/type válidos", () => {
    expect(read("../features/now/NowPage.tsx")).toContain('Gastos: "/movimientos?type=EXPENSE"');
    expect(read("./cuentas/page.tsx")).toContain("/movimientos?accountId=");
  });
});
