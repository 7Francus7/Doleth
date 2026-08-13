import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

const surfaces = {
  ahora: read("src/features/now/NowPage.tsx"),
  proximo: read("src/features/next/NextPage.tsx"),
  cambios: read("src/features/changes/ChangesPage.tsx"),
  progreso: read("src/features/progress/ProgressPage.tsx"),
  "mi-realidad": read("src/features/reality/RealityPage.tsx"),
  cierre: read("src/features/close/ClosePage.tsx"),
};

// ---------------------------------------------------------------------------
// Ninguna superficie recarga la app. Un `window.location.assign` a una ruta
// interna descarta el layout, el estado del router y el historial: la app
// vuelve a arrancar de cero para ir de una pantalla a otra.
// ---------------------------------------------------------------------------

describe("superficies: navegación interna sin recarga", () => {
  for (const [name, source] of Object.entries(surfaces)) {
    it(`${name} no recarga la app`, () => {
      expect(source).not.toContain("window.location.assign");
      expect(source).not.toContain("window.location.href");
      expect(source).not.toContain("window.location.replace");
    });
  }

  for (const [name, source] of Object.entries(surfaces)) {
    if (!source.includes("onAction")) continue;
    it(`${name} navega con el router de Next y declara sus destinos`, () => {
      expect(source).toContain('from "next/navigation"');
      expect(source).toContain("useRouter");
      expect(source).toContain("router.push");
      expect(source).toContain("ACTION_ROUTES");
    });
  }

  it("ninguna superficie manda a /actuar por defecto", () => {
    for (const source of Object.values(surfaces)) {
      expect(source).not.toContain('"/actuar"');
    }
  });

  it("los formularios vuelven con el router, no recargando", () => {
    const form = read("src/components/finance/MovementForm.tsx");
    expect(form).not.toContain("window.location");
    expect(form).toContain("router.push(returnTo)");
  });
});

// ---------------------------------------------------------------------------
// Guardrail transversal: ningún archivo productivo puede reintroducir la
// recarga completa. Los tests quedan fuera porque justamente la nombran.
// ---------------------------------------------------------------------------

const SOURCE_DIRS = ["src/app", "src/components", "src/features", "src/design-system"];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const productionFiles = SOURCE_DIRS.flatMap((dir) => walk(join(process.cwd(), dir)))
  .filter((file) => file.endsWith(".ts") || file.endsWith(".tsx"))
  .filter((file) => !file.endsWith(".test.ts") && !file.endsWith(".test.tsx"))
  .filter((file) => !file.includes(".stories."));

describe("guardrail: sin recargas internas completas", () => {
  it("encuentra archivos productivos para inspeccionar", () => {
    expect(productionFiles.length).toBeGreaterThan(0);
  });

  it("ningún componente productivo navega con window.location", () => {
    const offenders = productionFiles.filter((file) =>
      /window\.location\.(assign|href|replace)/.test(readFileSync(file, "utf8")),
    );
    expect(offenders.map((file) => file.replace(process.cwd(), ""))).toEqual([]);
  });

  it("ningún componente productivo usa <a> para una ruta interna", () => {
    const offenders = productionFiles.filter((file) =>
      /<a\s[^>]*href=["'`]\//.test(readFileSync(file, "utf8")),
    );
    expect(offenders.map((file) => file.replace(process.cwd(), ""))).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Primitivas de enlace: la decisión vive en un solo lugar.
// ---------------------------------------------------------------------------

describe("primitivas de enlace", () => {
  it("TextLink usa el router para destinos internos y <a> para anclas", () => {
    const source = read("src/design-system/primitives/TextLink/TextLink.tsx");
    expect(source).toContain('from "next/link"');
    expect(source).toContain("export function isInternalRoute");
    expect(source).toContain('href.startsWith("/")');
    expect(source).toContain('!href.startsWith("//")');
  });

  it("una fila navegable interna es un Link, no un <a>", () => {
    const source = read("src/design-system/composites/FinancialRow/FinancialRow.tsx");
    expect(source).toContain("isInternalRoute(props.href)");
    expect(source).toContain("<Link");
  });

  it("un enlace deshabilitado no navega", () => {
    const source = read("src/design-system/primitives/TextLink/TextLink.tsx");
    expect(source).toContain("if (disabled || !isInternalRoute(href))");
  });
});

// ---------------------------------------------------------------------------
// Restauración de scroll: se aplica donde hay una vuelta significativa desde un
// detalle. /cuentas no tiene detalle todavía, así que restaurar ahí sería una
// mecánica sin motivo. Este test se rompe el día que aparezca ese detalle.
// ---------------------------------------------------------------------------

describe("restauración de scroll: solo donde hay vuelta", () => {
  const accountsPage = read("src/app/cuentas/page.tsx");

  it("las listas con detalle navegable sí restauran", () => {
    expect(read("src/features/movements/MovementsExplorer.tsx")).toContain("RestorableList");
    expect(read("src/features/next/NextPage.tsx")).toContain("RestorableList");
  });

  it("/cuentas no navega a un detalle: no hay posición que recuperar", () => {
    const detailRoutes = readdirSync(join(process.cwd(), "src/app/cuentas"), {
      withFileTypes: true,
    })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
    // "nueva" es un formulario, no un detalle de la lista.
    expect(detailRoutes).toEqual(["nueva"]);
    expect(accountsPage).not.toContain("RestorableList");
    expect(accountsPage).not.toMatch(/href=\{`\/cuentas\//);
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
    expect(surfaces["mi-realidad"]).toContain("<section aria-label=");
    expect(surfaces.cierre).toContain("<section aria-label=");
  });

  it("las listas de causas, indicadores y señales son listas reales", () => {
    for (const name of ["cambios", "progreso", "mi-realidad", "cierre"] as const) {
      expect(surfaces[name]).toContain("<ul");
      expect(surfaces[name]).toContain("<li");
    }
  });

  it("los estados no dependen solo del color", () => {
    expect(surfaces.cambios).toContain("data-material=");
    expect(surfaces.progreso).toContain('milestone.achieved ? " · alcanzado" : " · todavía no"');
    expect(surfaces["mi-realidad"]).toContain('signal.state === "met" ? " · cumplida" : " · falta"');
    expect(surfaces.cierre).toContain('warning.severity === "review"');
  });

  it("las marcas decorativas quedan fuera del árbol accesible", () => {
    expect(surfaces.progreso).toContain('aria-hidden="true"');
    expect(surfaces["mi-realidad"]).toContain('aria-hidden="true"');
    expect(surfaces.cierre).toContain('aria-hidden="true"');
  });

  it("los avisos de degradación se anuncian", () => {
    for (const name of ["cambios", "progreso", "mi-realidad", "cierre"] as const) {
      expect(surfaces[name]).toContain('role="status"');
    }
  });
});
