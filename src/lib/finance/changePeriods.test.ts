import { describe, expect, it } from "vitest";
import {
  MAX_VISIBLE_CAUSES,
  compareChangePeriods,
  precedingPeriod,
  recentPeriod,
  stabilityThresholdCents,
  summarizeCauses,
  withinPeriod,
  type CategorizedMovement,
} from "./comparison";

const TODAY = "2026-07-24";
const PERIOD = recentPeriod(TODAY, 7);
const PREVIOUS = precedingPeriod(PERIOD);

const movement = (over: Partial<CategorizedMovement> & { id: string }): CategorizedMovement => ({
  type: "EXPENSE",
  amountCents: 0n,
  occurredOn: TODAY,
  voided: false,
  label: "Movimiento",
  accountName: "Banco",
  categoryId: null,
  categoryName: null,
  ...over,
});

const compare = (
  movements: CategorizedMovement[],
  over: Partial<Parameters<typeof compareChangePeriods>[0]> = {},
) =>
  compareChangePeriods({
    movements,
    period: PERIOD,
    previous: PREVIOUS,
    patrimonyCents: 1_000_000_00n,
    hasAccounts: true,
    firstMovementDay: "2026-01-01",
    ...over,
  });

describe("ventanas de comparación", () => {
  it("la ventana reciente termina hoy e incluye hoy", () => {
    expect(PERIOD).toEqual({ start: "2026-07-18", end: "2026-07-24", days: 7 });
  });

  it("la anterior es de la misma longitud y no se solapa", () => {
    expect(PREVIOUS).toEqual({ start: "2026-07-11", end: "2026-07-17", days: 7 });
    expect(PREVIOUS.end < PERIOD.start).toBe(true);
  });

  it("un movimiento del borde entra en su período", () => {
    const inside = [movement({ id: "a", occurredOn: "2026-07-18" })];
    expect(withinPeriod(inside, PERIOD)).toHaveLength(1);
    expect(withinPeriod(inside, PREVIOUS)).toHaveLength(0);
  });
});

describe("cambio del período", () => {
  it("suma ingresos y resta gastos no anulados", () => {
    const result = compare([
      movement({ id: "in", type: "INCOME", amountCents: 120_000_00n }),
      movement({ id: "out", amountCents: 45_000_00n }),
    ]);
    expect(result.netCents).toBe(75_000_00n);
    expect(result.incomeCents).toBe(120_000_00n);
    expect(result.expenseCents).toBe(45_000_00n);
  });

  it("una transferencia no cambia el patrimonio y se cuenta aparte", () => {
    const result = compare([
      movement({ id: "t", type: "TRANSFER", amountCents: 50_000_00n }),
      movement({ id: "in", type: "INCOME", amountCents: 20_000_00n }),
    ]);
    expect(result.netCents).toBe(20_000_00n);
    expect(result.transferCount).toBe(1);
    expect(result.transfersCents).toBe(50_000_00n);
    expect(result.causes.every((cause) => cause.id !== "transfer")).toBe(true);
  });

  it("un movimiento anulado no participa", () => {
    const result = compare([
      movement({ id: "void", amountCents: 90_000_00n, voided: true }),
      movement({ id: "out", amountCents: 10_000_00n }),
    ]);
    expect(result.netCents).toBe(-10_000_00n);
    expect(result.movementCount).toBe(1);
  });

  it("una corrección pesa una sola vez: el original anulado no cuenta", () => {
    const result = compare([
      movement({ id: "original", amountCents: 24_300_00n, voided: true }),
      movement({ id: "reemplazo", amountCents: 18_000_00n }),
    ]);
    expect(result.netCents).toBe(-18_000_00n);
  });

  it("el patrimonio inicial se deriva del actual y reconcilia", () => {
    const result = compare([movement({ id: "out", amountCents: 84_300_00n })]);
    expect(result.openingCents + result.netCents).toBe(result.closingCents);
  });

  it("compara contra el mismo período anterior, no contra el saldo", () => {
    const result = compare([
      movement({ id: "hoy", type: "INCOME", amountCents: 30_000_00n }),
      movement({ id: "antes", type: "INCOME", amountCents: 12_000_00n, occurredOn: "2026-07-14" }),
    ]);
    expect(result.netCents).toBe(30_000_00n);
    expect(result.previousNetCents).toBe(12_000_00n);
    expect(result.deltaCents).toBe(18_000_00n);
    expect(result.previousMovementCount).toBe(1);
  });
});

describe("estados", () => {
  it("sin cuentas no hay base", () => {
    expect(compare([], { hasAccounts: false }).state).toBe("no-base");
  });

  it("sin historial previo declara primer período comparable", () => {
    const result = compare([movement({ id: "a", type: "INCOME", amountCents: 90_000_00n })], {
      firstMovementDay: "2026-07-20",
    });
    expect(result.state).toBe("no-previous");
    expect(result.partialReason).toBe("no-history");
  });

  it("historial que arranca dentro del período anterior es parcial", () => {
    const result = compare(
      [
        movement({ id: "a", type: "INCOME", amountCents: 90_000_00n }),
        movement({ id: "b", type: "INCOME", amountCents: 10_000_00n, occurredOn: "2026-07-15" }),
      ],
      { firstMovementDay: "2026-07-15" },
    );
    expect(result.state).toBe("partial");
    expect(result.partialReason).toBe("shorter-history");
  });

  it("una variación por debajo del umbral es estable, no un cambio", () => {
    const result = compare([movement({ id: "a", amountCents: 2_000_00n })]);
    expect(result.state).toBe("stable");
    expect(result.thresholdCents).toBe(stabilityThresholdCents(result.openingCents));
  });

  it("por encima del umbral distingue subida de bajada", () => {
    expect(compare([movement({ id: "a", type: "INCOME", amountCents: 200_000_00n })]).state).toBe("up");
    expect(compare([movement({ id: "b", amountCents: 200_000_00n })]).state).toBe("down");
  });

  it("el umbral tiene piso absoluto y parte relativa", () => {
    expect(stabilityThresholdCents(0n)).toBe(5_000_00n);
    expect(stabilityThresholdCents(10_000_000_00n)).toBe(100_000_00n);
  });
});

describe("porcentaje", () => {
  it("se calcula sobre el patrimonio inicial", () => {
    const result = compare([movement({ id: "a", type: "INCOME", amountCents: 100_000_00n })]);
    expect(result.percent).toBeCloseTo(11.11, 1);
  });

  it("sin denominador positivo no hay porcentaje", () => {
    const result = compare([movement({ id: "a", type: "INCOME", amountCents: 10_000_00n })], {
      patrimonyCents: 10_000_00n,
    });
    expect(result.openingCents).toBe(0n);
    expect(result.percent).toBeNull();
  });
});

describe("causas", () => {
  const withCategory = (id: string, category: string, amountCents: bigint, type: "EXPENSE" | "INCOME" = "EXPENSE") =>
    movement({ id, type, amountCents, categoryId: category, categoryName: `Categoría ${category}` });

  it("agrupa por categoría y reconcilia con el neto", () => {
    const movements = [
      withCategory("a", "super", 20_000_00n),
      withCategory("b", "super", 10_000_00n),
      withCategory("c", "sueldo", 100_000_00n, "INCOME"),
    ];
    const { causes } = summarizeCauses(movements);
    const total = causes.reduce((sum, cause) => sum + cause.effectCents, 0n);
    expect(causes).toHaveLength(2);
    expect(total).toBe(70_000_00n);
    expect(causes[0]!.movementCount).toBe(1);
  });

  it("agrupa el resto en Otros sin perder reconciliación", () => {
    const movements = Array.from({ length: MAX_VISIBLE_CAUSES + 3 }, (_, index) =>
      withCategory(`m${index}`, `cat${index}`, BigInt((index + 1) * 1_000_00)),
    );
    const { causes, hiddenCount } = summarizeCauses(movements);
    const total = causes.reduce((sum, cause) => sum + cause.effectCents, 0n);
    expect(causes).toHaveLength(MAX_VISIBLE_CAUSES + 1);
    expect(causes.at(-1)!.id).toBe("other");
    expect(causes.at(-1)!.aggregated).toBe(true);
    expect(hiddenCount).toBe(3);
    expect(total).toBe(-28_000_00n);
  });

  it("los movimientos sin categoría se agrupan por tipo", () => {
    const { causes } = summarizeCauses([
      movement({ id: "a", amountCents: 5_000_00n }),
      movement({ id: "b", type: "INCOME", amountCents: 8_000_00n }),
    ]);
    expect(causes.map((cause) => cause.id).sort()).toEqual([
      "uncategorized:EXPENSE",
      "uncategorized:INCOME",
    ]);
  });

  it("la participación siempre tiene denominador y no supera 100", () => {
    const { causes, grossCents } = summarizeCauses([
      withCategory("a", "super", 30_000_00n),
      withCategory("b", "sueldo", 10_000_00n, "INCOME"),
    ]);
    expect(grossCents).toBe(40_000_00n);
    expect(causes.every((cause) => cause.share >= 0 && cause.share <= 100)).toBe(true);
  });

  it("marca material solo lo que supera el umbral de participación", () => {
    const { causes } = summarizeCauses([
      withCategory("a", "alquiler", 90_000_00n),
      withCategory("b", "cafe", 1_000_00n),
    ]);
    expect(causes[0]!.material).toBe(true);
    expect(causes[1]!.material).toBe(false);
  });

  it("sin movimientos no hay causas", () => {
    const { causes, hiddenCount } = summarizeCauses([]);
    expect(causes).toHaveLength(0);
    expect(hiddenCount).toBe(0);
  });

  it("una cuenta archivada no cambia la agrupación: la causa es la categoría", () => {
    const { causes } = summarizeCauses([
      withCategory("a", "super", 10_000_00n),
      { ...withCategory("b", "super", 5_000_00n), accountName: "Caja de ahorro vieja" },
    ]);
    expect(causes).toHaveLength(1);
    expect(causes[0]!.movementCount).toBe(2);
  });
});
