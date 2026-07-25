import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Guardrail de arquitectura: ninguna ruta productiva (src/app) puede alcanzar un
// fixture, ni escribiéndolo ni por transitividad a través de un barrel. Los
// fixtures son datos ficticios; en una pantalla que habla de dinero real serían
// una mentira lista para desplegarse. Para Storybook y tests existe `testing.ts`
// en cada feature.
//
// La versión anterior de este test solo buscaba la palabra "fixture" dentro de
// src/app, así que no veía el caso real: `src/app/proximo/page.tsx` importaba el
// barrel de `features/next`, que reexportaba sus fixtures.

const ROOT = process.cwd();
const APP_DIR = join(ROOT, "src", "app");
const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const isSource = (file: string) =>
  EXTENSIONS.some((extension) => file.endsWith(extension)) &&
  !file.endsWith(".test.ts") &&
  !file.endsWith(".test.tsx") &&
  !file.includes(".stories.");

/** Resuelve un import relativo a un archivo real: `./x`, `./x.ts` o `./x/index.ts`. */
function resolveImport(fromFile: string, specifier: string): string | null {
  if (!specifier.startsWith(".")) return null;
  const base = resolve(dirname(fromFile), specifier);
  const candidates = [
    base,
    ...EXTENSIONS.map((extension) => `${base}${extension}`),
    ...EXTENSIONS.map((extension) => join(base, `index${extension}`)),
  ];
  return (
    candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile()) ?? null
  );
}

const IMPORT_PATTERN = /(?:from|import)\s*["']([^"']+)["']/g;

function importsOf(file: string): string[] {
  const source = readFileSync(file, "utf8");
  const specifiers: string[] = [];
  for (const match of source.matchAll(IMPORT_PATTERN)) {
    const resolved = resolveImport(file, match[1]!);
    if (resolved) specifiers.push(resolved);
  }
  return specifiers;
}

const isFixture = (file: string) => {
  const path = relative(ROOT, file).replace(/\\/g, "/");
  return /(^|\/)fixtures\//.test(path) || /\.fixture\.[jt]sx?$/.test(path);
};

const isTestingBarrel = (file: string) =>
  relative(ROOT, file).replace(/\\/g, "/").endsWith("/testing.ts");

/** Todos los archivos que una ruta puede alcanzar siguiendo imports relativos. */
function reachableFrom(entries: string[]): Map<string, string[]> {
  const seen = new Map<string, string[]>();
  const queue: { file: string; trail: string[] }[] = entries.map((file) => ({
    file,
    trail: [file],
  }));

  while (queue.length > 0) {
    const { file, trail } = queue.shift()!;
    if (seen.has(file)) continue;
    seen.set(file, trail);
    for (const next of importsOf(file)) {
      if (!seen.has(next)) queue.push({ file: next, trail: [...trail, next] });
    }
  }
  return seen;
}

const routeFiles = walk(APP_DIR).filter(isSource);
const reachable = reachableFrom(routeFiles);

const short = (file: string) => relative(ROOT, file).replace(/\\/g, "/");

describe("guardrail: rutas productivas sin fixtures", () => {
  it("encuentra archivos de ruta para inspeccionar", () => {
    expect(routeFiles.length).toBeGreaterThan(0);
    expect(reachable.size).toBeGreaterThan(routeFiles.length);
  });

  it("ningún archivo de src/app menciona fixtures", () => {
    const offenders = routeFiles.filter((file) => /fixture/i.test(readFileSync(file, "utf8")));
    expect(offenders.map(short)).toEqual([]);
  });

  it("ninguna ruta alcanza un fixture por transitividad", () => {
    const offenders = [...reachable.entries()]
      .filter(([file]) => isFixture(file))
      .map(([, trail]) => trail.map(short).join(" → "));
    expect(offenders).toEqual([]);
  });

  it("ninguna ruta alcanza un barrel de testing", () => {
    const offenders = [...reachable.entries()]
      .filter(([file]) => isTestingBarrel(file))
      .map(([, trail]) => trail.map(short).join(" → "));
    expect(offenders).toEqual([]);
  });
});

describe("los fixtures siguen disponibles para stories y tests", () => {
  const features = ["act", "changes", "close", "next", "now", "progress", "reality"];

  for (const feature of features) {
    it(`features/${feature} expone su barrel de testing`, () => {
      const barrel = join(ROOT, "src", "features", feature, "testing.ts");
      expect(existsSync(barrel)).toBe(true);
      expect(readFileSync(barrel, "utf8")).toContain('export * from "./fixtures"');
    });

    it(`features/${feature} no expone fixtures en su barrel productivo`, () => {
      const source = readFileSync(join(ROOT, "src", "features", feature, "index.ts"), "utf8");
      expect(source).not.toMatch(/fixture/i);
      expect(source).not.toContain('from "./testing"');
    });
  }
});
