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
    expect(proxy).toContain("openSessionCookie");
    // El proxy no nombra la ruta: cae en el "todo lo demás es privado".
    expect(proxy).not.toContain("/api/export");
    expect(route).not.toContain("DATABASE_URL");
    expect(route).not.toContain("idempotencyKey");
  });

  it("el dueño sale de la sesión y nunca del pedido", () => {
    expect(route).toContain("getOptionalUser()");
    expect(route).toContain("createFinancialExport(user.id)");
    // Sin sesión responde 401 explícito, antes del try: un problema de
    // autorización no puede terminar disfrazado de fallo de lectura.
    expect(route).toContain("status: 401");
  });

  it("no acepta ningún identificador de usuario del cliente", () => {
    for (const source of [route, readFileSync(join(process.cwd(), "src/lib/export/data.ts"), "utf8")]) {
      expect(source).not.toMatch(/searchParams/);
      expect(source).not.toMatch(/get\(\s*["'`]userId["'`]\s*\)/);
      expect(source).not.toMatch(/headers\(\)/);
    }
  });

  it("ninguna consulta del snapshot queda sin propietario", () => {
    const data = readFileSync(join(process.cwd(), "src/lib/export/data.ts"), "utf8");
    const body = data.slice(data.indexOf("export async function createFinancialExport"));

    // Cada tramo entre una consulta y la siguiente tiene que nombrar `userId`.
    // Es un cerco barato contra el descuido; la garantía de verdad la da
    // `export-isolation.test.ts`, que corre esto contra Postgres con dos
    // usuarios y mira las filas que salen.
    const fragments = body.split(/db\.\w+\./).slice(1);
    expect(fragments.length).toBeGreaterThanOrEqual(5);
    for (const [index, fragment] of fragments.entries()) {
      expect(fragment.slice(0, 400), `consulta ${index + 1}`).toContain("userId");
    }
  });
});
