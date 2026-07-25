import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

const surfaces = {
  cambios: read("src/features/changes/ChangesPage.tsx"),
  progreso: read("src/features/progress/ProgressPage.tsx"),
  "mi-realidad": read("src/features/reality/RealityPage.tsx"),
};

describe("superficies analíticas: navegación interna", () => {
  for (const [name, source] of Object.entries(surfaces)) {
    it(`${name} no recarga la app`, () => {
      expect(source).not.toContain("window.location.assign");
      expect(source).not.toContain("window.location.href");
    });

    it(`${name} navega con el router de Next`, () => {
      expect(source).toContain('from "next/navigation"');
      expect(source).toContain("useRouter");
      expect(source).toContain("router.push");
    });

    it(`${name} declara a dónde va cada acción`, () => {
      expect(source).toContain("ACTION_ROUTES");
    });
  }

  it("las causas de /cambios son enlaces reales, no botones que simulan enlaces", () => {
    expect(surfaces.cambios).toContain('from "next/link"');
    expect(surfaces.cambios).toContain("<Link");
  });

  it("ninguna superficie analítica manda a /actuar por defecto", () => {
    for (const source of Object.values(surfaces)) {
      expect(source).not.toContain('"/actuar"');
    }
  });
});

describe("storybook puede montar pantallas que navegan", () => {
  it("el preview provee el contexto del app router", () => {
    // Sin esto `useRouter` rompe cada story aunque `build-storybook` pase.
    expect(read(".storybook/preview.ts")).toContain("appDirectory: true");
  });
});

describe("superficies analíticas: estructura accesible", () => {
  it("cada bloque es una sección con nombre", () => {
    expect(surfaces.cambios).toContain("<section aria-label=");
    expect(surfaces.progreso).toContain("<section aria-label=");
  });

  it("las listas de causas e indicadores son listas reales", () => {
    expect(surfaces.cambios).toContain("<ul");
    expect(surfaces.cambios).toContain("<li");
    expect(surfaces.progreso).toContain("<ul");
    expect(surfaces.progreso).toContain("<li");
  });

  it("los estados no dependen solo del color", () => {
    expect(surfaces.cambios).toContain("data-material=");
    expect(surfaces.progreso).toContain('milestone.achieved ? " · alcanzado" : " · todavía no"');
  });

  it("las marcas decorativas quedan fuera del árbol accesible", () => {
    expect(surfaces.progreso).toContain('aria-hidden="true"');
  });

  it("los avisos de degradación se anuncian", () => {
    expect(surfaces.cambios).toContain('role="status"');
    expect(surfaces.progreso).toContain('role="status"');
  });
});
