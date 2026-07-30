import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("contrato de seguridad de la beta privada", () => {
  const actions = read("src/app/auth/actions.ts");
  const tokenHook = read("src/components/auth/private-token.ts");
  const operator = read("prisma/ops/private-beta-access.ts");
  const proxy = read("src/proxy.ts");
  const packageJson = JSON.parse(read("package.json")) as {
    scripts: Record<string, string>;
  };

  it("cierra el registro directo en servidor y conserva una acción separada para invitaciones", () => {
    expect(actions).toContain("if (!publicEmailAuthEnabled()) return failure(PRIVATE_BETA_MESSAGE)");
    expect(actions).toContain("registerWithInvitationAction");
    expect(actions).toContain("consumePrivateBetaInvitation");
  });

  it("transporta tokens privados en fragmento y los retira de la barra", () => {
    expect(tokenHook).toContain("window.location.hash");
    expect(tokenHook).toContain("window.history.replaceState");
    expect(operator).toContain("#token=");
    expect(operator).not.toContain("?token=");
  });

  it("no expone rutas web administrativas y protege toda otra ruta por defecto", () => {
    expect(proxy).toContain('"/invitacion"');
    expect(proxy).toContain('"/acceso-temporal"');
    expect(proxy).not.toMatch(/\/admin|\/api\/invite|\/api\/recover/);
    expect(operator).toContain('DOLETH_ADMIN_OPERATIONS_ENABLED !== "1"');
    expect(operator).toContain("DOLETH_EXPECTED_DATABASE_HOST");
    expect(operator).toContain('process.argv.includes("--confirm")');
  });

  it("ejecuta el operador local bajo una condición de servidor explícita", () => {
    expect(packageJson.scripts["beta:access"]).toContain("--conditions=react-server");
  });
});
