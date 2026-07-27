import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "./manifest";

describe("contrato PWA prudente", () => {
  const worker = readFileSync(join(process.cwd(), "public/sw.js"), "utf8");
  const offline = readFileSync(join(process.cwd(), "public/offline.html"), "utf8");
  const manager = readFileSync(
    join(process.cwd(), "src/components/pwa/PwaManager.tsx"),
    "utf8",
  );

  it("es instalable y abre en Ahora", () => {
    const value = manifest();
    expect(value.start_url).toBe("/ahora");
    expect(value.scope).toBe("/");
    expect(value.display).toBe("standalone");
    expect(value.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sizes: "192x192" }),
        expect.objectContaining({ sizes: "512x512", purpose: "maskable" }),
      ]),
    );
  });

  it("nunca cachea páginas privadas ni APIs", () => {
    expect(worker).toContain('request.mode === "navigate"');
    expect(worker).toContain("fetch(request).catch");
    expect(worker).not.toContain("cache.put(request, response");
    expect(worker).not.toContain("/api/");
    expect(worker).not.toContain("/ahora");
  });

  it("la pantalla offline es honesta y no incluye cifras", () => {
    expect(offline).toContain("no guarda páginas financieras");
    expect(offline).not.toMatch(/\$\s?\d/);
  });

  it("la actualización es explícita y se retiene en formularios", () => {
    expect(manager).toContain("SKIP_WAITING");
    expect(manager).toContain("FORM_ROUTE.test(pathname)");
    expect(manager).toContain('"controllerchange"');
    expect(manager).toContain("window.location.reload()");
  });
});
