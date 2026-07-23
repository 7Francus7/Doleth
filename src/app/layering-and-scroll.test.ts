import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

/** Extrae el z-index del primer bloque cuyo selector contiene `selector`. */
function zIndexOf(css: string, selector: string): number {
  const block = css.split("}").find((chunk) => chunk.includes(selector));
  const match = block?.match(/z-index:\s*(\d+)/);
  if (!match) throw new Error(`Sin z-index para ${selector}`);
  return Number(match[1]);
}

describe("capas: un sheet modal nunca queda bajo la navegación fija", () => {
  const sheetCss = read("src/design-system/composites/BottomSheet/BottomSheet.module.css");
  const financeCss = read("src/components/finance/finance.module.css");

  const navZ = zIndexOf(financeCss, ".nav {");
  const overlayZ = zIndexOf(sheetCss, ".overlay {");
  const sheetZ = zIndexOf(sheetCss, ".sheet {");

  it("el overlay del sheet se dibuja sobre la barra de navegación", () => {
    expect(overlayZ).toBeGreaterThan(navZ);
  });

  it("el sheet se dibuja sobre su propio overlay y sobre la navegación", () => {
    expect(sheetZ).toBeGreaterThan(overlayZ);
    expect(sheetZ).toBeGreaterThan(navZ);
  });

  it("también queda sobre el footer fijo de formularios", () => {
    expect(sheetZ).toBeGreaterThan(zIndexOf(financeCss, ".movementSubmit {"));
  });
});

describe("scroll restoration: la posición se captura antes de navegar", () => {
  const src = read("src/components/finance/ScrollRestorer.tsx");

  it("escucha el click en fase de captura, antes de que el router resetee el scroll", () => {
    expect(src).toContain('document.addEventListener("click", save, true)');
    expect(src).toContain('document.removeEventListener("click", save, true)');
  });

  it("no depende de leer window.scrollY al desmontar (ahí ya vale 0)", () => {
    const cleanup = src.slice(src.indexOf("return () => {"));
    expect(cleanup).not.toContain("save()");
    expect(cleanup).not.toContain("scrollY");
  });

  it("persiste con clave por URL completa, de modo que otro filtro no reusa la posición", () => {
    expect(src).toContain("doleth:scroll:${storageKey}");
  });

  it("tolera sessionStorage no disponible sin romper la lista", () => {
    expect(src.match(/catch/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });
});
