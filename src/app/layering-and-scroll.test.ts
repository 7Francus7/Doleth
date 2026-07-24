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

describe("scroll restoration: cableado del contenedor de la lista", () => {
  const list = read("src/components/finance/MovementList.tsx");
  const page = read("src/app/movimientos/page.tsx");

  it("el contenedor client renderiza DOM propio: sin nodo no hay hidratación ni efecto", () => {
    expect(list).toContain('"use client"');
    expect(list).toContain("<div className={className}");
    expect(list).toContain("ref={containerRef}");
  });

  it("guarda en fase de captura sobre sus propias filas, sin listeners globales", () => {
    expect(list).toContain("onClickCapture={handleClickCapture}");
    expect(list).not.toContain('document.addEventListener("click"');
  });

  it("la lista de movimientos usa el contenedor con su ruta normalizada", () => {
    expect(page).toContain("<MovementList className={styles.list} restorationKey={listPath}>");
    expect(page).toContain("normalizeListPath(\"/movimientos\"");
  });

  it("la restauración está acotada en tiempo: no queda observando indefinidamente", () => {
    expect(list).toContain("SETTLE_BUDGET_MS");
    expect(list).toContain("performance.now() < deadline");
  });

  it("descarta la posición después de restaurarla, para no reaplicar una vieja", () => {
    expect(list).toContain("sessionStorage.removeItem(key)");
  });

  it("no reubica a quien ya empezó a desplazarse por su cuenta", () => {
    expect(list).toContain('window.addEventListener("wheel", cancel');
    expect(list).toContain('window.addEventListener("touchstart", cancel');
    expect(list).toContain('window.addEventListener("keydown", cancel)');
  });
});
