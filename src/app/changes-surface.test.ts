import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

const model = read("src/features/changes/data/getChangesModel.ts");
const page = read("src/features/changes/ChangesPage.tsx");
const data = read("src/lib/finance/data.ts");

describe("/cambios: empieza por la conclusión y la sostiene", () => {
  it("dice qué cambió y cuánto en una sola frase", () => {
    expect(model).toContain("tenés $${money(change.netCents)} más.");
    expect(model).toContain("tenés $${money(change.netCents)} menos.");
    expect(model).toContain("Tu situación se mantuvo prácticamente igual.");
  });

  it("declara período, valor inicial, valor final y diferencia", () => {
    expect(model).toContain('label: "Patrimonio al inicio"');
    expect(model).toContain('label: "Patrimonio hoy"');
    expect(model).toContain('label: "Diferencia"');
    expect(model).toContain("Mismo período anterior");
  });

  it("cada estado viaja como texto, no solo como color", () => {
    for (const label of ['"Sube"', '"Baja"', '"Estable"', '"Parcial"', '"Sin base"']) {
      expect(model).toContain(label);
    }
  });

  it("no usa porcentaje sin denominador", () => {
    expect(model).toContain("Sin patrimonio inicial positivo no se puede expresar el cambio en porcentaje");
    expect(model).toContain('"Sin porcentaje válido"');
  });

  it("declara el umbral en vez de exigir igualdad exacta", () => {
    expect(model).toContain("el umbral a partir del cual consideramos que un cambio es material");
  });

  it("no juzga: sin felicitaciones ni reproches", () => {
    for (const banned of ["Vas excelente", "Deberías", "salud financiera", "estás administrando"]) {
      expect(model.toLowerCase()).not.toContain(banned.toLowerCase());
    }
  });
});

describe("/cambios: causas reconciliadas", () => {
  it("agrupa causas y dice que la suma cierra", () => {
    expect(model).toContain("La suma de las causas da exactamente el cambio neto del período.");
    expect(model).toContain('están agrupadas en "Otros"');
  });

  it("cada causa muestra participación con denominador y cantidad de movimientos", () => {
    expect(model).toContain("% del movimiento bruto");
    expect(model).toContain("cause.movementCount");
    expect(model).toContain('"movimiento",');
  });

  it("las transferencias se mencionan aparte y nunca como causa", () => {
    expect(model).toContain("También moviste $");
    expect(model).toContain("no cuentan como causa");
  });

  it("el detalle por categoría no se ofrece si el filtro mostraría menos", () => {
    expect(model).toContain("period.start.slice(0, 7) !== period.end.slice(0, 7)");
  });

  it("el historial acepta el filtro por categoría que usan las causas", () => {
    expect(data).toContain("filters.categoryId ? { categoryId: filters.categoryId } : {}");
  });
});

describe("/cambios: evidencia y degradación", () => {
  it("la evidencia explica período, entradas, salidas y exclusiones", () => {
    expect(model).toContain("Cómo se calculó este cambio");
    expect(model).toContain("Patrimonio al inicio:");
    expect(model).toContain("quedan fuera: no cambian el patrimonio");
    expect(model).toContain("Los movimientos anulados y el original de una corrección no participan.");
  });

  it("si falta el desglose lo dice en vez de mostrar una conclusión completa", () => {
    expect(model).toContain("Pudimos calcular el cambio total, pero no cargar su desglose por causas.");
  });
});

describe("/cambios: navegación interna y acciones", () => {
  it("no recarga la app", () => {
    expect(page).not.toContain("window.location.assign");
  });

  it("usa router interno para las acciones y Link para las causas", () => {
    expect(page).toContain('from "next/navigation"');
    expect(page).toContain("router.push");
    expect(page).toContain('from "next/link"');
    expect(page).toContain("<Link");
  });

  it("una sola acción principal por estado", () => {
    expect(model).toContain('primaryLabel: "Crear una cuenta"');
    expect(model).toContain('primaryLabel: "Registrar un movimiento"');
    expect(model).toContain('primaryLabel: "Ver los movimientos que explican el cambio"');
    expect(page.match(/<ActionStrip/g)).toHaveLength(1);
  });

  it("los enlaces de causa conservan el contexto de retorno", () => {
    expect(model).toContain('volver: "/cambios"');
  });
});
