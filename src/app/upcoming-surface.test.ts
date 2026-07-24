import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

const nextModel = read("src/features/next/data/getNextModel.ts");
const nextPage = read("src/features/next/NextPage.tsx");

// ---------------------------------------------------------------------------
// Línea temporal, cobertura y saldo posterior
// ---------------------------------------------------------------------------

describe("/proximo: línea temporal, cobertura y saldo posterior", () => {
  it("agrupa por tramos temporales y no muestra grupos vacíos", () => {
    expect(nextModel).toContain("timeline.groups.map");
    expect(nextPage).toContain("model.timeline.map");
  });

  it("cada pago muestra fecha, cuenta, estado e importe", () => {
    expect(nextPage).toContain("payment.dateLabel");
    expect(nextPage).toContain("payment.accountName");
    expect(nextPage).toContain("payment.stateLabel");
    expect(nextPage).toContain("payment.amount");
  });

  it("el estado no depende solo del color: viaja como texto", () => {
    expect(nextModel).toContain('overdue: "Vencido"');
    expect(nextModel).toContain('"due-today": "Vence hoy"');
    expect(nextModel).toContain('pending: "Pendiente"');
  });

  it("un saldo negativo se explica como faltante, no como disponible negativo", () => {
    expect(nextModel).toContain("faltarían $");
    expect(nextModel).not.toContain("-$${money(cents)} disponibles");
  });

  it("la cobertura dice cubierto, total y faltante", () => {
    expect(nextModel).toContain("Tenés cubiertos $");
    expect(nextModel).toContain("para cubrir los pagos cargados");
    expect(nextModel).toContain("No podemos calcular cobertura sin cuentas.");
  });

  it("los pagos confirmados quedan fuera de cobertura y proyección, y se dice", () => {
    expect(nextModel).toContain("no participan de la cobertura ni de la proyección");
  });

  it("aclara que un pago previsto no es un movimiento", () => {
    expect(nextModel).toContain("recién descuenta de tus cuentas cuando lo confirmás");
  });
});

// ---------------------------------------------------------------------------
// Copy y accesibilidad de la superficie
// ---------------------------------------------------------------------------

describe("/proximo: vocabulario y estructura accesible", () => {
  it("usa el vocabulario acordado", () => {
    expect(nextModel).toContain("Pagos pendientes");
    expect(nextModel).toContain("Pagos confirmados");
  });

  it("el medidor de cobertura lleva un texto equivalente", () => {
    expect(nextModel).toContain("accessibleLabel:");
  });

  it("la línea temporal usa encabezados reales, no solo estilos", () => {
    expect(nextPage).toContain("<h2");
    expect(nextPage).toContain("<h3");
    expect(nextPage).toContain('aria-labelledby={`group-${group.id}`}');
  });

  it("los tramos se listan como lista ordenada", () => {
    expect(nextPage).toContain("<ol");
  });
});
