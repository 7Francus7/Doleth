import { describe, expect, it } from "vitest";
import { formatCents } from "../lib/finance/domain";
import { formatCentsAR } from "../lib/finance/amount";
import { describeDateAR } from "../lib/finance/movementDate";
import { computeCoverage } from "../lib/finance/projection";
import {
  compareChangePeriods,
  compareProgressPeriods,
  equivalentMonthPeriods,
  precedingPeriod,
  recentPeriod,
  type CategorizedMovement,
} from "../lib/finance/comparison";

const TODAY = "2026-07-24";

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
});
