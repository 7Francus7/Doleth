import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Guardrail de arquitectura: ninguna ruta productiva (src/app) puede importar ni
// referenciar fixtures. Los fixtures son exclusivos de Storybook y tests. Si una
// ruta vuelve a depender de datos ficticios, este test falla.

const APP_DIR = join(process.cwd(), "src", "app");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

describe("guardrail: rutas productivas sin fixtures", () => {
  const files = walk(APP_DIR).filter((file) => file.endsWith(".tsx") || file.endsWith(".ts"));

  it("encuentra archivos de ruta para inspeccionar", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("ningún archivo de src/app menciona fixtures", () => {
    const offenders = files.filter((file) => /fixture/i.test(readFileSync(file, "utf8")));
    expect(offenders.map((file) => file.replace(process.cwd(), ""))).toEqual([]);
  });
});
