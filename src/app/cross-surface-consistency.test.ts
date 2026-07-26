import { describe, expect, it } from "vitest";
import { formatCents } from "../lib/finance/domain";
import { formatCentsAR } from "../lib/finance/amount";
import { describeDateAR, describeMonthAR } from "../lib/finance/movementDate";
import {
  computeCoverage,
  patrimonyCents,
  selectCommitments,
  type ProjectionAccount,
  type UpcomingCommitment,
} from "../lib/finance/projection";
import {
  compareChangePeriods,
  compareProgressPeriods,
  equivalentMonthPeriods,
  precedingPeriod,
  recentPeriod,
  type CategorizedMovement,
} from "../lib/finance/comparison";
import { computeReality, splitCommitments, type RealityMovement } from "../lib/finance/reality";
import { computeClose, monthPeriod } from "../lib/finance/close";

const TODAY = "2026-07-24";

const movement = (over: Partial<CategorizedMovement> & { id: string }): CategorizedMovement => ({
  type: "EXPENSE",
  amountCents: 0n,
  occurredOn: TODAY,
  voided: false,
  label: "Movimiento",
  accountName: "Banco",
  categoryId: "cat-default",
  categoryName: "Categoría de prueba",
  ...over,
});

// ---------------------------------------------------------------------------
// Las dos superficies analíticas leen el mismo ledger con las mismas reglas.
// ---------------------------------------------------------------------------

describe("las reglas del ledger valen igual en /cambios y en /progreso", () => {
  const period = recentPeriod(TODAY, 7);
  const previous = precedingPeriod(period);
  const months = equivalentMonthPeriods(TODAY);

  const inBoth = (movements: CategorizedMovement[]) => ({
    change: compareChangePeriods({
      movements,
      period,
      previous,
      patrimonyCents: 1_000_000_00n,
      hasAccounts: true,
      firstMovementDay: "2026-01-01",
    }),
    progress: compareProgressPeriods({
      movements,
      current: months.current,
      previous: months.previous,
      equivalent: months.equivalent,
      hasAccounts: true,
      patrimonyCents: 1_000_000_00n,
      baseCents: 1_000_000_00n,
      committedCents: 0n,
      overdueCount: 0,
    }),
  });

  it("una transferencia interna no es cambio ni progreso", () => {
    const { change, progress } = inBoth([
      movement({ id: "t", type: "TRANSFER", amountCents: 250_000_00n }),
    ]);
    expect(change.netCents).toBe(0n);
    expect(progress.netCents).toBe(0n);
  });

  it("un anulado no cuenta en ninguna de las dos", () => {
    const { change, progress } = inBoth([
      movement({ id: "v", amountCents: 90_000_00n, voided: true }),
    ]);
    expect(change.netCents).toBe(0n);
    expect(progress.netCents).toBe(0n);
  });

  it("una corrección pesa una sola vez en ambas", () => {
    const { change, progress } = inBoth([
      movement({ id: "original", amountCents: 24_300_00n, voided: true }),
      movement({ id: "reemplazo", amountCents: 18_000_00n }),
    ]);
    expect(change.netCents).toBe(-18_000_00n);
    expect(progress.netCents).toBe(-18_000_00n);
  });
});

describe("la cobertura significa lo mismo en /ahora y en /progreso", () => {
  const cases: readonly [bigint, bigint][] = [
    [1_153_700_00n, 535_900_00n],
    [396_500_00n, 535_900_00n],
    [0n, 100_000_00n],
    [500_000_00n, 0n],
  ];

  for (const [baseCents, committedCents] of cases) {
    it(`base ${baseCents} contra ${committedCents} da el mismo porcentaje`, () => {
      const now = computeCoverage(baseCents, committedCents);
      const progress = compareProgressPeriods({
        movements: [],
        current: { start: "2026-07-01", end: TODAY, days: 24 },
        previous: { start: "2026-06-01", end: "2026-06-24", days: 24 },
        equivalent: true,
        hasAccounts: true,
        patrimonyCents: baseCents,
        baseCents,
        committedCents,
        overdueCount: 0,
      });
      expect(progress.coveragePercent).toBe(now.percent);
      expect(progress.missingCents).toBe(now.missingCents);
    });
  }
});

// ---------------------------------------------------------------------------
// El patrimonio significa lo mismo en /mi-realidad, /cambios y /progreso, y el
// cierre no puede contar una plata distinta de la que compone la realidad.
// ---------------------------------------------------------------------------

const JULY = monthPeriod("2026-07", TODAY);

const realityMovement = (
  over: Partial<RealityMovement> & { id: string },
): RealityMovement => ({
  type: "EXPENSE",
  amountCents: 0n,
  occurredOn: "2026-07-10",
  voided: false,
  label: "Movimiento",
  accountName: "Banco",
  ...over,
});

describe("el patrimonio es el mismo en todas las superficies", () => {
  const balances: readonly [string, bigint, boolean][] = [
    ["banco", 412_000_00n, false],
    ["efectivo", 86_500_00n, false],
    ["vieja", 40_000_00n, true],
  ];

  const projectionAccounts: ProjectionAccount[] = balances.map(([id, balanceCents, archived]) => ({
    id,
    name: id,
    balanceCents,
    archived,
  }));

  const reality = computeReality({
    today: TODAY,
    period: JULY,
    accounts: balances.map(([id, balanceCents, archived]) => ({
      id,
      name: id,
      type: "BANK",
      balanceCents,
      initialBalanceCents: balanceCents,
      archived,
      lastActivityOn: null,
      movementCount: 0,
    })),
    investments: [{ id: "i", name: "Fondo", currentValueCents: 305_000_00n }],
    commitments: [],
    movements: [],
  });

  it("/mi-realidad usa la misma suma que /ahora y /proximo", () => {
    expect(reality.patrimonyCents).toBe(patrimonyCents(projectionAccounts));
  });

  it("las inversiones no entran en ninguna de las dos definiciones", () => {
    expect(reality.patrimonyCents).toBe(538_500_00n);
    expect(reality.investedCents).toBe(305_000_00n);
  });

  it("el cierre de un mes sin movimientos coincide con el patrimonio actual", () => {
    const close = computeClose({
      period: JULY,
      today: TODAY,
      patrimonyNowCents: reality.patrimonyCents,
      accounts: balances.map(([id, balanceCents, archived]) => ({
        id,
        name: id,
        type: "BANK",
        archived,
        balanceCents,
        withinCents: 0n,
        afterCents: 0n,
        lastActivityOn: null,
      })),
      movements: [],
      payments: [],
    });
    expect(close.closingCents).toBe(reality.patrimonyCents);
    expect(close.openingCents).toBe(reality.patrimonyCents);
  });
});

describe("el horizonte de compromisos es uno solo", () => {
  const commitments: UpcomingCommitment[] = [
    {
      id: "cerca",
      concept: "Luz",
      dueOn: "2026-08-01",
      amountCents: 41_800_00n,
      accountId: "a",
      accountName: "Banco",
      accountBalanceCents: 0n,
      frequency: null,
      createdAtMs: 0,
    },
    {
      id: "lejos",
      concept: "Patente",
      dueOn: "2026-10-01",
      amountCents: 73_000_00n,
      accountId: "a",
      accountName: "Banco",
      accountBalanceCents: 0n,
      frequency: null,
      createdAtMs: 0,
    },
  ];

  it("/mi-realidad y la proyección de /ahora cortan en el mismo día", () => {
    const reality = splitCommitments(commitments, TODAY);
    const projection = selectCommitments(commitments, TODAY);
    expect(reality.horizonEnd).toBe(projection.horizonEnd);
    expect(reality.horizonDays).toBe(projection.horizonDays);
  });

  it("lo comprometido cerca es lo mismo que descuenta la proyección", () => {
    const reality = splitCommitments(commitments, TODAY);
    const projection = selectCommitments(commitments, TODAY);
    expect(reality.nearCents).toBe(projection.committedCents);
  });

  it("lo que queda afuera se declara igual en las dos", () => {
    const reality = splitCommitments(commitments, TODAY);
    const projection = selectCommitments(commitments, TODAY);
    expect(reality.beyondCents).toBe(projection.excludedCents);
  });
});

describe("el resultado del mes se cuenta una sola vez", () => {
  const movements = [
    realityMovement({ id: "sueldo", type: "INCOME", amountCents: 900_000_00n }),
    realityMovement({ id: "alquiler", amountCents: 448_700_00n }),
    realityMovement({ id: "transfer", type: "TRANSFER", amountCents: 50_000_00n }),
    realityMovement({ id: "anulado", amountCents: 99_000_00n, voided: true }),
    realityMovement({ id: "original", amountCents: 24_300_00n, voided: true, corrected: true }),
    realityMovement({ id: "reemplazo", amountCents: 18_000_00n }),
  ];

  const reality = computeReality({
    today: TODAY,
    period: JULY,
    accounts: [
      {
        id: "a",
        name: "Banco",
        type: "BANK",
        balanceCents: 1_231_300_00n,
        initialBalanceCents: 780_000_00n,
        archived: false,
        lastActivityOn: "2026-07-10",
        movementCount: 4,
      },
    ],
    investments: [],
    commitments: [],
    movements,
  });

  const close = computeClose({
    period: JULY,
    today: TODAY,
    patrimonyNowCents: 1_231_300_00n,
    accounts: [
      {
        id: "a",
        name: "Banco",
        type: "BANK",
        archived: false,
        balanceCents: 1_231_300_00n,
        withinCents: 433_300_00n,
        afterCents: 0n,
        lastActivityOn: "2026-07-10",
      },
    ],
    movements,
    payments: [],
  });

  it("/mi-realidad y el cierre calculan el mismo resultado del período", () => {
    expect(reality.activity.netCents).toBe(close.netCents);
    expect(reality.activity.incomeCents).toBe(close.movements.incomeCents);
    expect(reality.activity.expenseCents).toBe(close.movements.expenseCents);
  });

  it("la transferencia no aparece en el resultado de ninguna de las dos", () => {
    expect(reality.activity.transferCents).toBe(close.movements.transferCents);
    expect(reality.activity.netCents).toBe(900_000_00n - 466_700_00n);
  });

  it("el anulado y el original corregido no cuentan en ninguna de las dos", () => {
    expect(reality.activity.movementCount).toBe(3);
    expect(close.movements.totalCount).toBe(3);
    expect(close.movements.voidedCount).toBe(2);
  });

  it("el cierre reconcilia con el patrimonio que muestra /mi-realidad", () => {
    expect(close.closingCents).toBe(reality.patrimonyCents);
    expect(close.openingCents + close.netCents).toBe(close.closingCents);
  });
});

// ---------------------------------------------------------------------------
// Formato compartido: un importe se lee igual en todas las pantallas.
// ---------------------------------------------------------------------------

describe("formato de importes", () => {
  it("millones se agrupan en castellano", () => {
    expect(formatCents(17_480_300_00n)).toBe("17.480.300");
  });

  it("los centavos no se pierden ni se redondean solos", () => {
    expect(formatCents(12_500_50n)).toBe("12.500,50");
  });

  it("cero es cero, no vacío", () => {
    expect(formatCents(0n)).toBe("0");
  });

  it("el signo lo pone la pantalla, no el formateador", () => {
    expect(formatCents(-84_300_00n)).toBe("-84.300");
  });

  it("todas las superficies comparten el mismo formateador", () => {
    expect(formatCents(1_234_567_89n)).toBe(formatCentsAR(1_234_567_89n));
  });
});

describe("porcentajes con denominador", () => {
  const period = recentPeriod(TODAY, 7);
  const previous = precedingPeriod(period);

  const percentOf = (patrimonyCents: bigint, amountCents: bigint) =>
    compareChangePeriods({
      movements: [movement({ id: "a", type: "INCOME", amountCents })],
      period,
      previous,
      patrimonyCents,
      hasAccounts: true,
      firstMovementDay: "2026-01-01",
    }).percent;

  it("sin patrimonio inicial no hay porcentaje", () => {
    expect(percentOf(50_000_00n, 50_000_00n)).toBeNull();
  });

  it("con denominador positivo el porcentaje es la variación real", () => {
    expect(percentOf(1_100_000_00n, 100_000_00n)).toBeCloseTo(10, 5);
  });
});

describe("fechas argentinas", () => {
  it("el día civil se dice en castellano", () => {
    expect(describeDateAR("2026-07-18", TODAY).toLowerCase()).toContain("18 de julio");
  });

  it("hoy y ayer se nombran como tales", () => {
    expect(describeDateAR(TODAY, TODAY).toLowerCase()).toContain("hoy");
    expect(describeDateAR("2026-07-23", TODAY).toLowerCase()).toContain("ayer");
  });

  it("un mes del año en curso no repite el año", () => {
    expect(describeMonthAR("2026-07", TODAY)).toBe("julio");
  });

  it("un mes de otro año lo dice, para no confundir dos eneros", () => {
    expect(describeMonthAR("2025-12", TODAY)).toBe("diciembre de 2025");
  });
});
