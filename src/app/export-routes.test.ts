import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("rutas de exportación", () => {
  const route = readFileSync(
    join(process.cwd(), "src/app/api/export/[file]/route.ts"),
    "utf8",
  );
  const proxy = readFileSync(join(process.cwd(), "src/proxy.ts"), "utf8");

  it("solo ofrece los cuatro CSV declarados y una copia JSON", () => {
    for (const file of [
      "movimientos.csv",
      "cuentas.csv",
      "proximos-pagos.csv",
      "inversiones.csv",
      "datos.json",
    ]) {
      expect(route).toContain(file);
    }
  });

  it("queda detrás de la sesión y no expone secretos", () => {
    expect(proxy).toContain("verifyAccessToken");
    expect(proxy).not.toContain("/api/export");
    expect(route).not.toContain("DATABASE_URL");
    expect(route).not.toContain("idempotencyKey");
  });
});
