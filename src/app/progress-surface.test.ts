import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

const model = read("src/features/progress/data/getProgressModel.ts");
const page = read("src/features/progress/ProgressPage.tsx");
const data = read("src/lib/finance/data.ts");

describe("/progreso: interpretación factual", () => {
  it("dice qué pasó contra qué referencia, sin adjetivos de desempeño", () => {
    expect(model).toContain("mayor que el del mismo tramo del mes anterior");
    expect(model).toContain("menor que el del mismo tramo del mes anterior");
    expect(model).toContain("igual al del mismo tramo del mes anterior");
  });

  it("no emite juicios financieros genéricos", () => {
    for (const banned of [
      "Vas excelente",
      "Deberías ahorrar",
      "salud financiera",
      "Estás administrando",
      "gastaste más de lo que ingresó",
    ]) {
      expect(model.toLowerCase()).not.toContain(banned.toLowerCase());
    }
  });

  it("no felicita por gastar menos ni culpabiliza por gastar más", () => {
    expect(model).not.toContain("Mejoraste");
    expect(model).not.toContain("Retrocediste");
  });
});

describe("/progreso: indicadores con denominador y fórmula", () => {
  it("cada indicador declara su fórmula", () => {
    expect(model).toContain("formula:");
    expect(model).toContain("Ingresos − gastos no anulados del período, sin transferencias.");
    expect(model).toContain("Días con al menos un movimiento no anulado sobre días transcurridos del período.");
    expect(model).toContain("Dinero en cuentas activas sobre pagos pendientes del horizonte de 30 días.");
  });

  it("los porcentajes viajan con su denominador visible", () => {
    expect(model).toContain("de ${progress.current.days}");
    expect(model).toContain("% de los $${money(progress.committedCents)} comprometidos");
  });

  it("no todos los indicadores tienen dirección deseable", () => {
    expect(model).toContain("direction: null");
    expect(model).toContain('direction: "up-is-better"');
    expect(model).toContain('direction: "down-is-better"');
  });

  it("hay entre dos y cuatro indicadores, no un tablero", () => {
    const ids = model.match(/^\s{6}id: "(net|consistency|coverage|overdue)"/gm) ?? [];
    expect(ids.length).toBeGreaterThanOrEqual(2);
    expect(ids.length).toBeLessThanOrEqual(4);
  });
});

describe("/progreso: comparación equivalente", () => {
  it("compara tramos equivalentes y lo dice", () => {
    expect(model).toContain("Tramos equivalentes");
    expect(model).toContain("Misma cantidad de días en los dos tramos");
    expect(data).toContain("equivalentMonthPeriods(today)");
  });

  it("advierte cuando el mes anterior es más corto", () => {
    expect(model).toContain("El mes anterior es más corto");
    expect(model).toContain("El mes anterior terminó antes");
  });

  it("sin tramo anterior no afirma mejora ni retroceso", () => {
    expect(model).toContain("sin ese tramo no se puede afirmar mejora ni retroceso");
  });

  it("la cobertura usa la misma base que /ahora", () => {
    expect(data).toContain("baseCents: accountsMoneyCents(projectionAccounts)");
    expect(data).toContain("selectCommitments(commitments, today)");
  });
});

describe("/progreso: hitos sin celebración repetida", () => {
  it("los hitos se muestran como información estable", () => {
    expect(model).toContain("no se guardan ni se celebran dos veces");
  });

  it("cada hito dice qué pasa cuando todavía no se alcanzó", () => {
    expect(model).toContain("pending:");
    expect(page).toContain('data-achieved={milestone.achieved ? "true" : "false"}');
  });

  it("la marca visual no es el único indicador de estado", () => {
    expect(page).toContain('milestone.achieved ? " · alcanzado" : " · todavía no"');
    expect(page).toContain('aria-hidden="true"');
  });
});

describe("/progreso: navegación y resiliencia", () => {
  it("no recarga la app", () => {
    expect(page).not.toContain("window.location.assign");
    expect(page).toContain('from "next/navigation"');
    expect(page).toContain("router.push");
  });

  it("una acción principal por estado, sin mandar siempre a /actuar", () => {
    expect(model).toContain('primaryLabel: "Crear una cuenta"');
    expect(model).toContain('primaryLabel: "Revisar próximos pagos"');
    expect(model).toContain('primaryLabel: "Completar información"');
    expect(model).toContain('primaryLabel: "Ver cómo se calculó"');
    expect(page).not.toContain('"/actuar"');
    expect(page.match(/<ActionStrip/g)).toHaveLength(1);
  });

  it("si no se pueden leer los compromisos lo declara y omite la cobertura", () => {
    expect(model).toContain("no cargar los próximos pagos: la cobertura queda fuera de esta lectura");
    expect(data).toContain("commitmentsAvailable: pending !== null");
  });
});
