import { describe, expect, it } from "vitest";
import {
  compareProgressPeriods,
  daysWithActivity,
  equivalentMonthPeriods,
  type Period,
} from "./comparison";
import type { AnalysisMovement } from "./analysis";

const TODAY = "2026-07-24";
const { current, previous, equivalent } = equivalentMonthPeriods(TODAY);

const movement = (over: Partial<AnalysisMovement> & { id: string }): AnalysisMovement => ({
  type: "EXPENSE",
  amountCents: 0n,
  occurredOn: TODAY,
  voided: false,
  label: "",
  accountName: "",
  ...over,
});

const compare = (
  movements: AnalysisMovement[],
  over: Partial<Parameters<typeof compareProgressPeriods>[0]> = {},
) =>
  compareProgressPeriods({
    movements,
    current,
    previous,
    equivalent,
    hasAccounts: true,
    patrimonyCents: 1_193_700_00n,
    baseCents: 1_153_700_00n,
    committedCents: 535_900_00n,
    overdueCount: 0,
    ...over,
  });

describe("tramos equivalentes", () => {
  it("compara los mismos días del mes anterior", () => {
    expect(current).toEqual({ start: "2026-07-01", end: "2026-07-24", days: 24 });
    expect(previous).toEqual({ start: "2026-06-01", end: "2026-06-24", days: 24 });
    expect(equivalent).toBe(true);
  });

  it("acota el tramo cuando el mes anterior es más corto y lo declara", () => {
    const periods = equivalentMonthPeriods("2026-03-31");
    expect(periods.previous).toEqual({ start: "2026-02-01", end: "2026-02-28", days: 28 });
    expect(periods.equivalent).toBe(false);
  });

  it("cruza el año hacia atrás sin inventar meses", () => {
    const periods = equivalentMonthPeriods("2026-01-15");
    expect(periods.previous.start).toBe("2025-12-01");
    expect(periods.previous.end).toBe("2025-12-15");
  });

  it("nunca compara un mes parcial contra un mes completo", () => {
    const periods = equivalentMonthPeriods("2026-07-10");
    expect(periods.current.days).toBe(10);
    expect(periods.previous.days).toBe(10);
  });
});

describe("indicadores factuales", () => {
  it("el resultado del tramo suma ingresos y resta gastos", () => {
    const result = compare([
      movement({ id: "in", type: "INCOME", amountCents: 780_000_00n, occurredOn: "2026-07-02" }),
      movement({ id: "out", amountCents: 135_000_00n, occurredOn: "2026-07-15" }),
    ]);
    expect(result.netCents).toBe(645_000_00n);
    expect(result.incomeCents).toBe(780_000_00n);
    expect(result.expenseCents).toBe(135_000_00n);
  });

  it("una transferencia no altera el resultado del tramo", () => {
    const result = compare([
      movement({ id: "t", type: "TRANSFER", amountCents: 50_000_00n, occurredOn: "2026-07-05" }),
    ]);
    expect(result.netCents).toBe(0n);
  });

  it("un anulado no cuenta como progreso ni como retroceso", () => {
    const result = compare([
      movement({ id: "v", amountCents: 99_000_00n, occurredOn: "2026-07-05", voided: true }),
    ]);
    expect(result.netCents).toBe(0n);
    expect(result.state).toBe("first-period");
  });

  it("la consistencia usa días transcurridos como denominador", () => {
    const result = compare([
      movement({ id: "a", occurredOn: "2026-07-02", amountCents: 1_00n }),
      movement({ id: "b", occurredOn: "2026-07-02", amountCents: 1_00n }),
      movement({ id: "c", occurredOn: "2026-07-09", amountCents: 1_00n }),
    ]);
    expect(result.activeDays).toBe(2);
    expect(result.current.days).toBe(24);
    expect(result.consistency).toBe(8);
  });

  it("los días con actividad ignoran anulados", () => {
    expect(
      daysWithActivity(
        [movement({ id: "a", occurredOn: "2026-07-03", voided: true })],
        current as Period,
      ),
    ).toBe(0);
  });

  it("la cobertura usa cuentas activas contra lo comprometido", () => {
    const result = compare([]);
    expect(result.coveragePercent).toBe(100);
    expect(result.missingCents).toBe(0n);
  });

  it("cuando falta cobertura declara cuánto falta y nunca redondea a favor", () => {
    const result = compare([], { baseCents: 396_500_00n });
    // 73,99 % se muestra como 73: la cobertura nunca se exagera.
    expect(result.coveragePercent).toBe(73);
    expect(result.missingCents).toBe(139_400_00n);
  });

  it("sin compromisos la cobertura no alarma y se declara sin denominador propio", () => {
    const result = compare([], { committedCents: 0n });
    expect(result.hasCommitments).toBe(false);
    expect(result.coveragePercent).toBe(100);
  });

  it("los pagos vencidos se cuentan sobre el estado actual", () => {
    expect(compare([], { overdueCount: 2 }).overdueCount).toBe(2);
  });
});

describe("estado del progreso", () => {
  const withHistory = (currentCents: bigint, previousCents: bigint) =>
    compare([
      movement({ id: "now", type: "INCOME", amountCents: currentCents, occurredOn: "2026-07-10" }),
      movement({ id: "before", type: "INCOME", amountCents: previousCents, occurredOn: "2026-06-10" }),
    ]);

  it("sin cuentas no hay progreso que medir", () => {
    expect(compare([], { hasAccounts: false }).state).toBe("no-base");
  });

  it("sin tramo anterior con movimientos es el primer período", () => {
    const result = compare([
      movement({ id: "a", type: "INCOME", amountCents: 84_500_00n, occurredOn: "2026-07-10" }),
    ]);
    expect(result.state).toBe("first-period");
    expect(result.hasPreviousPeriod).toBe(false);
  });

  it("mejora y retroceso se afirman solo contra el tramo equivalente", () => {
    expect(withHistory(300_000_00n, 100_000_00n).state).toBe("improved");
    expect(withHistory(100_000_00n, 300_000_00n).state).toBe("declined");
    expect(withHistory(200_000_00n, 200_000_00n).state).toBe("flat");
  });

  it("la diferencia entre tramos es la resta de los dos netos", () => {
    const result = withHistory(300_000_00n, 100_000_00n);
    expect(result.deltaCents).toBe(result.netCents - result.previousNetCents);
  });
});

describe("hitos", () => {
  it("se derivan del estado actual y son verificables", () => {
    const result = compare([
      movement({ id: "now", type: "INCOME", amountCents: 300_000_00n, occurredOn: "2026-07-10" }),
      movement({ id: "before", type: "INCOME", amountCents: 100_000_00n, occurredOn: "2026-06-10" }),
    ]);
    const achieved = new Map(result.milestones.map((milestone) => [milestone.id, milestone.achieved]));
    expect(achieved.get("first-comparable-period")).toBe(true);
    expect(achieved.get("positive-patrimony")).toBe(true);
    expect(achieved.get("full-coverage")).toBe(true);
    expect(achieved.get("no-overdue")).toBe(true);
  });

  it("un hito no alcanzado no se inventa", () => {
    const result = compare([], { baseCents: 10_000_00n, overdueCount: 3, patrimonyCents: -5_000_00n });
    const achieved = new Map(result.milestones.map((milestone) => [milestone.id, milestone.achieved]));
    expect(achieved.get("positive-patrimony")).toBe(false);
    expect(achieved.get("full-coverage")).toBe(false);
    expect(achieved.get("no-overdue")).toBe(false);
    expect(achieved.get("consistent-registration")).toBe(false);
  });
});
