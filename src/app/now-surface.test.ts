import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

const nowModel = read("src/features/now/data/getNowModel.ts");
const nowPage = read("src/features/now/NowPage.tsx");

// ---------------------------------------------------------------------------
// Jerarquía y acción principal
// ---------------------------------------------------------------------------

describe("/ahora: responde en orden y ofrece una sola acción principal", () => {
  it("el número principal se nombra por lo que el dominio puede sostener", () => {
    expect(nowModel).toContain('valueLabel: "Dinero en tus cuentas"');
    expect(nowModel).not.toContain('valueLabel: "Disponible');
  });

  it("dice cuánto está comprometido junto al número principal", () => {
    expect(nowModel).toContain("comprometidos ${horizonLabel}");
  });

  it("la proyección explica su fórmula y su horizonte", () => {
    expect(nowModel).toContain("Después de los pagos cargados quedarían aproximadamente");
    expect(nowModel).toContain('label: "Comprometido"');
    expect(nowModel).toContain('"Faltarían" : "Quedarían"');
    expect(nowModel).toContain("con vencimiento ${horizonLabel}");
  });

  it("no promete: evita el copy de saldo garantizado", () => {
    expect(nowModel).not.toContain("Vas a tener");
    expect(nowModel).not.toContain("Está todo cubierto");
  });

  it("declara lo que quedó fuera del horizonte en vez de ocultarlo", () => {
    expect(nowModel).toContain('"no está incluido", "no están incluidos"');
  });

  it("un proyectado negativo se dice como faltante, no como saldo positivo", () => {
    expect(nowModel).toContain("Los pagos cargados superan tu dinero: faltarían $");
    expect(nowModel).toContain('"Faltarían" : "Quedarían"');
  });

  it("una acción principal por estado, sin dos caminos compitiendo", () => {
    expect(nowModel).toContain('primaryLabel: "Crear una cuenta"');
    expect(nowModel).toContain('primaryLabel: "Revisar próximos pagos"');
    expect(nowModel).toContain('primaryLabel: "Registrar un movimiento"');
    expect(nowPage).toContain("<ActionStrip");
    // Un solo ActionStrip en la pantalla.
    expect(nowPage.match(/<ActionStrip/g)).toHaveLength(1);
  });

  it("la atención es concreta: nombra el pago y qué le pasó", () => {
    expect(nowModel).toContain("venció ${describeDuePhraseAR(");
    expect(nowModel).toContain("todavía figura pendiente");
  });

  it("los estados vacíos no se presentan como error", () => {
    expect(nowModel).toContain("Empezá por representar dónde está tu dinero.");
    expect(nowModel).toContain("Creá una cuenta para que Doleth pueda mostrar tu situación actual.");
    expect(nowModel).toContain("No hay pagos próximos cargados.");
  });

  it("distingue anulado de corregido en los movimientos recientes", () => {
    expect(nowModel).toContain('" · Corregido"');
    expect(nowModel).toContain('" · Anulado"');
  });

  it("ya no dibuja un gráfico decorativo por encima de la explicación", () => {
    expect(nowPage).not.toContain("TrendChart");
  });

  it("declara cuántas cuentas entran en la lectura y cuántas quedan fuera", () => {
    expect(nowModel).toContain('"cuenta activa", "cuentas activas"');
    expect(nowModel).toContain("fuera de esta lectura");
  });
});

// ---------------------------------------------------------------------------
// Copy y accesibilidad de la superficie
// ---------------------------------------------------------------------------

describe("/ahora: vocabulario y equivalentes de texto", () => {
  it("usa el vocabulario acordado", () => {
    expect(nowModel).toContain("Comprometido");
    expect(nowModel).toContain("Quedarían");
  });

  it("el medidor de cobertura lleva un texto equivalente", () => {
    expect(nowModel).toContain("accessibleLabel:");
  });

  it("la proyección es una sección con nombre", () => {
    expect(nowPage).toContain('aria-labelledby="projection-title"');
  });
});
