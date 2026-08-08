import { describe, expect, it } from "vitest";
import {
  MIN_RECURRENCE_OCCURRENCES,
  biggestIncreases,
  buildSpendingReport,
  detectRecurring,
  formatShare,
  groupSpending,
  totalSpentCents,
  type SpendingMovement,
} from "./spending";

let sequence = 0;
const movement = (overrides: Partial<SpendingMovement> = {}): SpendingMovement => ({
  id: `mov-${(sequence += 1)}`,
  occurredOn: "2026-08-05",
  amountCents: 100_000n,
  type: "EXPENSE",
  voided: false,
  categoryId: "food",
  categoryName: "Comida",
  merchant: "Coto",
  accountId: "banco",
  accountName: "Banco Nación",
  ...overrides,
});

const period = { start: "2026-08-01", end: "2026-08-31", days: 31 };

describe("qué cuenta como gasto", () => {
  /**
   * Mover plata de una cuenta propia a otra no la gasta. Contarlo infla el total
   * con dinero que sigue estando, y es el error que hace que la gente desconfíe
   * del reporte y vuelva al Excel.
   */
  it("una transferencia no es un gasto", () => {
    const total = totalSpentCents([
      movement({ amountCents: 100_000n }),
      movement({ amountCents: 900_000n, type: "TRANSFER" }),
    ]);
    expect(total).toBe(100_000n);
  });

  it("un ingreso tampoco", () => {
    expect(totalSpentCents([movement({ amountCents: 500_000n, type: "INCOME" })])).toBe(0n);
  });

  it("lo anulado no cuenta, igual que en los saldos", () => {
    const total = totalSpentCents([
      movement({ amountCents: 100_000n }),
      movement({ amountCents: 700_000n, voided: true }),
    ]);
    expect(total).toBe(100_000n);
  });
});

describe("groupSpending", () => {
  const movements = [
    movement({ amountCents: 300_000n, categoryId: "food", categoryName: "Comida", merchant: "Coto" }),
    movement({ amountCents: 200_000n, categoryId: "food", categoryName: "Comida", merchant: "Dia" }),
    movement({ amountCents: 500_000n, categoryId: "rent", categoryName: "Alquiler", merchant: "Alquiler" }),
  ];

  it("agrupa por categoría y ordena de mayor a menor", () => {
    const slices = groupSpending(movements, "category");
    expect(slices.map((slice) => slice.label)).toEqual(["Alquiler", "Comida"]);
    expect(slices[0]?.amountCents).toBe(500_000n);
    expect(slices[1]?.amountCents).toBe(500_000n);
    expect(slices[1]?.movementCount).toBe(2);
  });

  it("agrupa por comercio", () => {
    const slices = groupSpending(movements, "merchant");
    expect(slices.map((slice) => slice.label).sort()).toEqual(["Alquiler", "Coto", "Dia"]);
  });

  it("agrupa por cuenta", () => {
    const slices = groupSpending([...movements, movement({ accountId: "visa", accountName: "Visa" })], "account");
    expect(slices.map((slice) => slice.label)).toContain("Visa");
  });

  /**
   * Un desglose cuyos porcentajes suman 99,7 destruye la confianza en el total
   * que está arriba, aunque cada parte esté "bien redondeada" por separado.
   */
  it("las participaciones suman exactamente el total", () => {
    const tercios = [
      movement({ amountCents: 100_000n, categoryId: "a", categoryName: "A" }),
      movement({ amountCents: 100_000n, categoryId: "b", categoryName: "B" }),
      movement({ amountCents: 100_000n, categoryId: "c", categoryName: "C" }),
    ];
    const slices = groupSpending(tercios, "category");
    expect(slices.reduce((sum, slice) => sum + slice.shareBasisPoints, 0)).toBe(10_000);
  });

  it("agrupa lo que no tiene categoría en vez de descartarlo", () => {
    const slices = groupSpending([movement({ categoryId: null, categoryName: null })], "category");
    expect(slices[0]?.label).toBe("Sin categoría");
  });

  it("compara contra el período anterior cuando lo hay", () => {
    const anterior = [movement({ amountCents: 100_000n, categoryId: "food", categoryName: "Comida" })];
    const slices = groupSpending(movements, "category", anterior);
    const comida = slices.find((slice) => slice.label === "Comida")!;
    expect(comida.previousCents).toBe(100_000n);
    expect(comida.deltaCents).toBe(400_000n);
  });

  /** Sin período anterior, la comparación es `null` y no cero: no es lo mismo. */
  it("sin período anterior no inventa una comparación", () => {
    const slices = groupSpending(movements, "category");
    expect(slices[0]?.previousCents).toBeNull();
    expect(slices[0]?.deltaCents).toBeNull();
  });

  it("un rubro que existía y ya no aparece se compara contra cero", () => {
    const anterior = [movement({ amountCents: 90_000n, categoryId: "gym", categoryName: "Gimnasio" })];
    const slices = groupSpending(movements, "category", anterior);
    expect(slices.find((slice) => slice.label === "Gimnasio")).toBeUndefined();
  });

  it("sin movimientos devuelve una lista vacía y no rompe", () => {
    expect(groupSpending([], "category")).toEqual([]);
  });
});

describe("biggestIncreases", () => {
  /**
   * "¿Por qué gasté más este mes?" es distinto de "¿en qué gasté más?". Un rubro
   * grande y estable no explica nada; uno chico que se duplicó, sí.
   */
  it("devuelve lo que más creció, no lo más grande", () => {
    const slices = groupSpending(
      [
        movement({ amountCents: 1_000_000n, categoryId: "rent", categoryName: "Alquiler" }),
        movement({ amountCents: 200_000n, categoryId: "fun", categoryName: "Salidas" }),
      ],
      "category",
      [
        movement({ amountCents: 990_000n, categoryId: "rent", categoryName: "Alquiler" }),
        movement({ amountCents: 20_000n, categoryId: "fun", categoryName: "Salidas" }),
      ],
    );
    expect(biggestIncreases(slices)[0]?.label).toBe("Salidas");
  });

  it("ignora lo que bajó: la pregunta es sobre lo que subió", () => {
    const slices = groupSpending(
      [movement({ amountCents: 100_000n, categoryId: "fun", categoryName: "Salidas" })],
      "category",
      [movement({ amountCents: 500_000n, categoryId: "fun", categoryName: "Salidas" })],
    );
    expect(biggestIncreases(slices)).toEqual([]);
  });
});

describe("detectRecurring", () => {
  const monthly = (merchant: string, cents: bigint, days: readonly string[]) =>
    days.map((day) => movement({ merchant, amountCents: cents, occurredOn: day }));

  it("reconoce una suscripción mensual", () => {
    const found = detectRecurring(
      monthly("Spotify", 39_990n, ["2026-05-06", "2026-06-06", "2026-07-06", "2026-08-06"]),
    );
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({
      merchant: "Spotify",
      occurrences: 4,
      typicalCents: 39_990n,
      cadence: "monthly",
      lastSeenOn: "2026-08-06",
    });
  });

  it("reconoce una cadencia semanal y la lleva a su equivalente mensual", () => {
    const found = detectRecurring(
      monthly("Verdulería", 20_000n, ["2026-07-06", "2026-07-13", "2026-07-20", "2026-07-27"]),
    );
    expect(found[0]?.cadence).toBe("weekly");
    // 20.000 por semana son unos 85.714 por mes.
    expect(found[0]?.monthlyCents).toBe(85_714n);
  });

  /**
   * Ir tres veces al mismo supermercado en una semana no es un gasto recurrente:
   * es hacer las compras. Lo que distingue una suscripción es que los intervalos
   * son parejos.
   */
  it("no confunde varias visitas seguidas con una suscripción", () => {
    const found = detectRecurring(
      monthly("Coto", 50_000n, ["2026-08-01", "2026-08-02", "2026-08-03", "2026-08-28"]),
    );
    expect(found).toEqual([]);
  });

  /**
   * Un solo cobro duplicado —o un resumen importado dos veces— metía un
   * intervalo de cero días que disparaba la dispersión y hacía desaparecer una
   * suscripción impecable. Dos cargos el mismo día son un evento para medir
   * cadencia.
   */
  it("un cargo duplicado el mismo día no rompe la detección", () => {
    const found = detectRecurring([
      movement({ merchant: "Alquiler", amountCents: 480_000n, occurredOn: "2026-05-01" }),
      movement({ merchant: "Alquiler", amountCents: 480_000n, occurredOn: "2026-06-01" }),
      movement({ merchant: "Alquiler", amountCents: 480_000n, occurredOn: "2026-07-01" }),
      movement({ merchant: "Alquiler", amountCents: 480_000n, occurredOn: "2026-08-01" }),
      // El mismo cargo, cobrado dos veces.
      movement({ merchant: "Alquiler", amountCents: 480_000n, occurredOn: "2026-08-01" }),
    ]);
    expect(found).toHaveLength(1);
    // Cuatro meses, no cinco cargos: la cuenta es de eventos, no de filas.
    expect(found[0]?.occurrences).toBe(4);
    expect(found[0]?.cadence).toBe("monthly");
  });

  it("exige un mínimo de apariciones para hablar de repetición", () => {
    expect(detectRecurring(monthly("Netflix", 60_000n, ["2026-07-10", "2026-08-10"]))).toEqual([]);
    expect(MIN_RECURRENCE_OCCURRENCES).toBe(3);
  });

  /**
   * Un cargo anómalo correría el promedio y haría que el número no se parezca a
   * ninguno de los cargos reales.
   */
  it("usa la mediana y no el promedio para el importe habitual", () => {
    const found = detectRecurring([
      movement({ merchant: "Gimnasio", amountCents: 50_000n, occurredOn: "2026-05-10" }),
      movement({ merchant: "Gimnasio", amountCents: 50_000n, occurredOn: "2026-06-10" }),
      movement({ merchant: "Gimnasio", amountCents: 900_000n, occurredOn: "2026-07-10" }),
      movement({ merchant: "Gimnasio", amountCents: 50_000n, occurredOn: "2026-08-10" }),
    ]);
    expect(found[0]?.typicalCents).toBe(50_000n);
  });

  it("tolera que la fecha se corra unos días entre meses", () => {
    const found = detectRecurring(
      monthly("Edesur", 80_000n, ["2026-05-08", "2026-06-11", "2026-07-09", "2026-08-12"]),
    );
    expect(found).toHaveLength(1);
  });

  it("ordena por cuánto pesan al mes", () => {
    const found = detectRecurring([
      ...monthly("Spotify", 39_990n, ["2026-06-06", "2026-07-06", "2026-08-06"]),
      ...monthly("Alquiler", 4_800_000n, ["2026-06-01", "2026-07-01", "2026-08-01"]),
    ]);
    expect(found.map((item) => item.merchant)).toEqual(["Alquiler", "Spotify"]);
  });

  it("ignora las transferencias, igual que el resto del reporte", () => {
    const found = detectRecurring(
      monthly("Ahorro", 100_000n, ["2026-06-01", "2026-07-01", "2026-08-01"]).map((item) => ({
        ...item,
        type: "TRANSFER" as const,
      })),
    );
    expect(found).toEqual([]);
  });
});

describe("buildSpendingReport", () => {
  it("arma la lectura completa del período", () => {
    const report = buildSpendingReport({
      period,
      movements: [
        movement({ amountCents: 300_000n, categoryId: "food", categoryName: "Comida", merchant: "Coto" }),
        movement({ amountCents: 500_000n, categoryId: "rent", categoryName: "Alquiler", merchant: "Alquiler" }),
        movement({ amountCents: 900_000n, type: "TRANSFER", merchant: "Ahorro" }),
      ],
      previousMovements: [movement({ amountCents: 600_000n, categoryId: "food", categoryName: "Comida" })],
      recurringWindow: [],
    });

    expect(report.totalCents).toBe(800_000n);
    expect(report.previousTotalCents).toBe(600_000n);
    expect(report.deltaCents).toBe(200_000n);
    expect(report.movementCount).toBe(2);
    expect(report.byCategory).toHaveLength(2);
    expect(report.byMerchant.map((slice) => slice.label)).not.toContain("Ahorro");
  });

  /**
   * La ventana de recurrencia es más ancha que el período: mirando sólo el mes
   * en curso no se vería ni una sola repetición mensual.
   */
  it("detecta recurrentes sobre una ventana más ancha que el período", () => {
    const report = buildSpendingReport({
      period,
      movements: [movement({ amountCents: 39_990n, merchant: "Spotify", occurredOn: "2026-08-06" })],
      previousMovements: [],
      recurringWindow: [
        movement({ amountCents: 39_990n, merchant: "Spotify", occurredOn: "2026-06-06" }),
        movement({ amountCents: 39_990n, merchant: "Spotify", occurredOn: "2026-07-06" }),
        movement({ amountCents: 39_990n, merchant: "Spotify", occurredOn: "2026-08-06" }),
      ],
    });
    expect(report.recurring).toHaveLength(1);
    expect(report.recurringMonthlyCents).toBe(39_990n);
  });

  it("promedia por día para poder comparar meses de distinto largo", () => {
    const report = buildSpendingReport({
      period: { start: "2026-08-01", end: "2026-08-10", days: 10 },
      movements: [movement({ amountCents: 1_000_000n })],
      previousMovements: [],
      recurringWindow: [],
    });
    expect(report.dailyAverageCents).toBe(100_000n);
  });

  it("un período sin gasto da cero y no rompe", () => {
    const report = buildSpendingReport({ period, movements: [], previousMovements: [], recurringWindow: [] });
    expect(report.totalCents).toBe(0n);
    expect(report.byCategory).toEqual([]);
    expect(report.dailyAverageCents).toBe(0n);
  });
});

describe("formatShare", () => {
  it("muestra un decimal en participaciones chicas y ninguno en las grandes", () => {
    expect(formatShare(3_250)).toBe("33 %");
    expect(formatShare(250)).toBe("2,5 %");
    expect(formatShare(10_000)).toBe("100 %");
  });
});
