import { describe, expect, it } from "vitest";
import {
  CLOSE_STEPS,
  computeClose,
  monthPeriod,
  nextStep,
  previousMonth,
  previousStep,
  resolvePeriod,
  resolveStep,
  selectablePeriods,
  stepNumber,
  type CloseAccount,
  type CloseInput,
  type ClosePayment,
} from "./close";
import type { RealityMovement } from "./reality";

const TODAY = "2026-07-24";
const JULY = monthPeriod("2026-07", TODAY);
const JUNE = monthPeriod("2026-06", TODAY);

const account = (over: Partial<CloseAccount> & { id: string }): CloseAccount => ({
  name: "Banco",
  type: "BANK",
  archived: false,
  balanceCents: 0n,
  withinCents: 0n,
  afterCents: 0n,
  lastActivityOn: null,
  ...over,
});

const movement = (over: Partial<RealityMovement> & { id: string }): RealityMovement => ({
  type: "EXPENSE",
  amountCents: 0n,
  occurredOn: "2026-07-10",
  voided: false,
  label: "Movimiento",
  accountName: "Banco",
  categoryId: "cat",
  ...over,
});

const payment = (over: Partial<ClosePayment> & { id: string }): ClosePayment => ({
  concept: "Servicio",
  dueOn: "2026-07-15",
  amountCents: 10_000_00n,
  accountName: "Banco",
  status: "PENDING",
  ...over,
});

const input = (over: Partial<CloseInput> = {}): CloseInput => ({
  period: JULY,
  today: TODAY,
  patrimonyNowCents: 0n,
  accounts: [],
  movements: [],
  payments: [],
  ...over,
});

// ---------------------------------------------------------------------------
// Períodos
// ---------------------------------------------------------------------------

describe("períodos revisables", () => {
  it("un mes civil va del 1 al último día real", () => {
    expect(monthPeriod("2026-07", TODAY)).toMatchObject({
      start: "2026-07-01",
      end: "2026-07-31",
      days: 31,
    });
    expect(monthPeriod("2026-02", TODAY).end).toBe("2026-02-28");
    expect(monthPeriod("2028-02", TODAY).end).toBe("2028-02-29");
  });

  it("el mes en curso se declara abierto y el anterior no", () => {
    expect(monthPeriod("2026-07", TODAY).open).toBe(true);
    expect(monthPeriod("2026-06", TODAY).open).toBe(false);
  });

  it("el mes anterior cruza el cambio de año", () => {
    expect(previousMonth("2026-01")).toBe("2025-12");
    expect(previousMonth("2026-07")).toBe("2026-06");
  });

  it("se ofrecen exactamente dos períodos: el actual y el anterior", () => {
    const options = selectablePeriods("2027-01-05");
    expect(options.map((period) => period.month)).toEqual(["2027-01", "2026-12"]);
  });

  it("un período no revisable cae al mes en curso en vez de romper", () => {
    expect(resolvePeriod("2019-03", TODAY).month).toBe("2026-07");
    expect(resolvePeriod(undefined, TODAY).month).toBe("2026-07");
    expect(resolvePeriod("2026-06", TODAY).month).toBe("2026-06");
  });

  it("un mes inválido es un error, no una fecha inventada", () => {
    expect(() => monthPeriod("2026-13", TODAY)).toThrow();
    expect(() => monthPeriod("julio", TODAY)).toThrow();
  });
});

describe("pasos", () => {
  it("son siete y el progreso es textual", () => {
    expect(CLOSE_STEPS).toHaveLength(7);
    expect(stepNumber("periodo")).toBe(1);
    expect(stepNumber("resumen")).toBe(7);
  });

  it("un paso desconocido cae al primero", () => {
    expect(resolveStep("inexistente")).toBe("periodo");
    expect(resolveStep(undefined)).toBe("periodo");
    expect(resolveStep("resultado")).toBe("resultado");
  });

  it("el primero no tiene anterior y el último no tiene siguiente", () => {
    expect(previousStep("periodo")).toBeNull();
    expect(nextStep("resumen")).toBeNull();
    expect(nextStep("periodo")).toBe("cuentas");
    expect(previousStep("resumen")).toBe("resultado");
  });
});

// ---------------------------------------------------------------------------
// Reconciliación
// ---------------------------------------------------------------------------

describe("reconciliación del período", () => {
  const scenario = () =>
    input({
      // Patrimonio de hoy: 1.231.300. Después de julio no hay nada registrado.
      patrimonyNowCents: 1_231_300_00n,
      accounts: [
        account({
          id: "banco",
          balanceCents: 1_231_300_00n,
          withinCents: 451_300_00n,
          lastActivityOn: "2026-07-23",
        }),
      ],
      movements: [
        movement({ id: "i", type: "INCOME", amountCents: 900_000_00n, occurredOn: "2026-07-03" }),
        movement({ id: "g", amountCents: 448_700_00n, occurredOn: "2026-07-05" }),
      ],
    });

  it("inicial + ingresos − gastos = final", () => {
    const result = computeClose(scenario());
    expect(result.openingCents).toBe(780_000_00n);
    expect(result.movements.incomeCents).toBe(900_000_00n);
    expect(result.movements.expenseCents).toBe(448_700_00n);
    expect(result.netCents).toBe(451_300_00n);
    expect(result.closingCents).toBe(1_231_300_00n);
    expect(result.reconciles).toBe(true);
  });

  it("reconcilia siempre, también con resultado negativo", () => {
    const result = computeClose(
      input({
        patrimonyNowCents: 50_000_00n,
        accounts: [account({ id: "a", balanceCents: 50_000_00n, withinCents: -90_000_00n })],
        movements: [movement({ id: "g", amountCents: 90_000_00n })],
      }),
    );
    expect(result.netCents).toBe(-90_000_00n);
    expect(result.openingCents).toBe(140_000_00n);
    expect(result.closingCents).toBe(50_000_00n);
    expect(result.openingCents + result.netCents).toBe(result.closingCents);
  });

  it("los movimientos posteriores al período no se cuelan en el cierre", () => {
    const result = computeClose(
      input({
        period: JUNE,
        patrimonyNowCents: 1_231_300_00n,
        accounts: [
          account({ id: "a", balanceCents: 1_231_300_00n, withinCents: 280_000_00n, afterCents: 451_300_00n }),
        ],
        movements: [
          movement({ id: "junio-i", type: "INCOME", amountCents: 700_000_00n, occurredOn: "2026-06-05" }),
          movement({ id: "junio-g", amountCents: 420_000_00n, occurredOn: "2026-06-10" }),
          movement({ id: "julio", amountCents: 448_700_00n, occurredOn: "2026-07-05" }),
        ],
      }),
    );
    expect(result.closingCents).toBe(780_000_00n);
    expect(result.netCents).toBe(280_000_00n);
    expect(result.openingCents).toBe(500_000_00n);
    expect(result.afterCents).toBe(451_300_00n);
    expect(result.reconciles).toBe(true);
  });

  it("cada cuenta reconcilia por separado y la suma da el patrimonio", () => {
    const result = computeClose(
      input({
        patrimonyNowCents: 538_500_00n,
        accounts: [
          account({ id: "banco", balanceCents: 412_000_00n, withinCents: 100_000_00n }),
          account({ id: "efectivo", name: "Efectivo", balanceCents: 86_500_00n, withinCents: -20_000_00n }),
          account({ id: "vieja", name: "Cuenta vieja", balanceCents: 40_000_00n, archived: true }),
        ],
        movements: [
          movement({ id: "i", type: "INCOME", amountCents: 100_000_00n }),
          movement({ id: "g", amountCents: 20_000_00n }),
        ],
      }),
    );
    const sumClosing = result.accounts.reduce((total, item) => total + item.closingCents, 0n);
    const sumOpening = result.accounts.reduce((total, item) => total + item.openingCents, 0n);
    expect(sumClosing).toBe(result.closingCents);
    expect(sumOpening).toBe(result.openingCents);
    expect(result.archivedAccounts).toHaveLength(1);
    expect(result.activeAccounts).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Reglas del ledger dentro del cierre
// ---------------------------------------------------------------------------

describe("qué cuenta y qué no", () => {
  const base = {
    patrimonyNowCents: 100_000_00n,
    accounts: [account({ id: "a", balanceCents: 100_000_00n })],
  };

  it("una transferencia no altera el resultado y se cuenta aparte", () => {
    const result = computeClose(
      input({ ...base, movements: [movement({ id: "t", type: "TRANSFER", amountCents: 50_000_00n })] }),
    );
    expect(result.netCents).toBe(0n);
    expect(result.movements.transferCents).toBe(50_000_00n);
    expect(result.movements.transferCount).toBe(1);
    expect(result.movements.totalCount).toBe(0);
  });

  it("un anulado no cuenta pero queda declarado", () => {
    const result = computeClose(
      input({ ...base, movements: [movement({ id: "v", amountCents: 99_000_00n, voided: true })] }),
    );
    expect(result.movements.expenseCents).toBe(0n);
    expect(result.movements.voidedCount).toBe(1);
  });

  it("una corrección cuenta una sola vez: solo el reemplazo", () => {
    const result = computeClose(
      input({
        ...base,
        movements: [
          movement({ id: "orig", amountCents: 24_300_00n, voided: true, corrected: true }),
          movement({ id: "fix", amountCents: 18_000_00n }),
        ],
      }),
    );
    expect(result.movements.expenseCents).toBe(18_000_00n);
    expect(result.movements.correctedCount).toBe(1);
    expect(result.movements.totalCount).toBe(1);
  });

  it("los movimientos sin categoría se cuentan sin dejar de sumar", () => {
    const result = computeClose(
      input({
        ...base,
        movements: [
          movement({ id: "sin", amountCents: 5_000_00n, categoryId: null }),
          movement({ id: "con", amountCents: 3_000_00n }),
        ],
      }),
    );
    expect(result.movements.uncategorizedCount).toBe(1);
    expect(result.movements.expenseCents).toBe(8_000_00n);
  });
});

// ---------------------------------------------------------------------------
// Compromisos
// ---------------------------------------------------------------------------

describe("compromisos del período", () => {
  const payments = [
    payment({ id: "pagado", dueOn: "2026-07-05", amountCents: 30_000_00n, status: "PAID" }),
    payment({ id: "vencido", dueOn: "2026-07-20", amountCents: 41_800_00n }),
    payment({ id: "pendiente", dueOn: "2026-07-30", amountCents: 28_400_00n }),
    payment({ id: "fuera", dueOn: "2026-09-10", amountCents: 73_000_00n }),
  ];

  it("separa pagados, vencidos, pendientes y fuera del período", () => {
    const result = computeClose(
      input({
        patrimonyNowCents: 1n,
        accounts: [account({ id: "a", balanceCents: 1n })],
        payments,
      }),
    );
    expect(result.payments.paid.map((item) => item.id)).toEqual(["pagado"]);
    expect(result.payments.overdue.map((item) => item.id)).toEqual(["vencido"]);
    expect(result.payments.pending.map((item) => item.id)).toEqual(["pendiente"]);
    expect(result.payments.outside.map((item) => item.id)).toEqual(["fuera"]);
  });

  it("los compromisos no cambian el resultado del período", () => {
    const withPayments = computeClose(
      input({ patrimonyNowCents: 100n, accounts: [account({ id: "a", balanceCents: 100n })], payments }),
    );
    const without = computeClose(
      input({ patrimonyNowCents: 100n, accounts: [account({ id: "a", balanceCents: 100n })] }),
    );
    expect(withPayments.netCents).toBe(without.netCents);
    expect(withPayments.closingCents).toBe(without.closingCents);
  });

  it("un pago futuro no bloquea la revisión", () => {
    const result = computeClose(
      input({
        patrimonyNowCents: 1n,
        accounts: [account({ id: "a", balanceCents: 1n })],
        payments: [payment({ id: "fuera", dueOn: "2026-12-01" })],
      }),
    );
    expect(result.warnings.map((warning) => warning.id)).not.toContain("overdue");
  });
});

// ---------------------------------------------------------------------------
// Advertencias
// ---------------------------------------------------------------------------

describe("advertencias honestas", () => {
  it("un período en curso se declara sin llamarlo error", () => {
    const result = computeClose(
      input({ patrimonyNowCents: 1n, accounts: [account({ id: "a", balanceCents: 1n })] }),
    );
    const open = result.warnings.find((warning) => warning.id === "period-open");
    expect(open?.severity).toBe("info");
  });

  it("sin movimientos lo dice, sin afirmar que no pasó nada", () => {
    const result = computeClose(
      input({ patrimonyNowCents: 1n, accounts: [account({ id: "a", balanceCents: 1n })] }),
    );
    expect(result.warnings.map((warning) => warning.id)).toContain("no-movements");
  });

  it("sin ingresos avisa solo cuando sí hubo movimientos", () => {
    const result = computeClose(
      input({
        patrimonyNowCents: 1n,
        accounts: [account({ id: "a", balanceCents: 1n })],
        movements: [movement({ id: "g", amountCents: 1_000_00n })],
      }),
    );
    const ids = result.warnings.map((warning) => warning.id);
    expect(ids).toContain("no-income");
    expect(ids).not.toContain("no-movements");
  });

  it("cuenta los movimientos sin categoría", () => {
    const result = computeClose(
      input({
        patrimonyNowCents: 1n,
        accounts: [account({ id: "a", balanceCents: 1n })],
        movements: [
          movement({ id: "a", amountCents: 100n, categoryId: null }),
          movement({ id: "b", amountCents: 100n, categoryId: null }),
        ],
      }),
    );
    const warning = result.warnings.find((item) => item.id === "uncategorized");
    expect(warning?.count).toBe(2);
    expect(warning?.severity).toBe("review");
  });

  it("una cuenta sin actividad es informativa, no un error", () => {
    const result = computeClose(
      input({
        patrimonyNowCents: 2n,
        accounts: [
          account({ id: "a", balanceCents: 1n, withinCents: 1n }),
          account({ id: "b", name: "Efectivo", balanceCents: 1n }),
        ],
        movements: [movement({ id: "m", type: "INCOME", amountCents: 1n })],
      }),
    );
    const warning = result.warnings.find((item) => item.id === "account-without-activity");
    expect(warning?.count).toBe(1);
    expect(warning?.severity).toBe("info");
  });

  it("una lectura de pagos caída se declara y suprime el aviso de vencidos", () => {
    const result = computeClose(
      input({
        patrimonyNowCents: 1n,
        accounts: [account({ id: "a", balanceCents: 1n })],
        payments: [payment({ id: "v", dueOn: "2026-07-01" })],
        paymentsAvailable: false,
      }),
    );
    const ids = result.warnings.map((warning) => warning.id);
    expect(ids).toContain("payments-unavailable");
    expect(ids).not.toContain("overdue");
  });

  it("con advertencias el resultado se calcula igual", () => {
    const result = computeClose(
      input({
        patrimonyNowCents: 100_000_00n,
        accounts: [account({ id: "a", balanceCents: 100_000_00n, withinCents: -20_000_00n })],
        movements: [movement({ id: "g", amountCents: 20_000_00n, categoryId: null })],
        payments: [payment({ id: "v", dueOn: "2026-07-01" })],
      }),
    );
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.reconciles).toBe(true);
    expect(result.netCents).toBe(-20_000_00n);
  });
});

describe("período sin datos", () => {
  it("sin cuentas no hay nada que revisar", () => {
    const result = computeClose(input());
    expect(result.hasAccounts).toBe(false);
    expect(result.empty).toBe(true);
    expect(result.openingCents).toBe(0n);
    expect(result.closingCents).toBe(0n);
  });

  it("con cuentas y sin movimientos el resultado es cero y reconcilia", () => {
    const result = computeClose(
      input({
        patrimonyNowCents: 180_000_00n,
        accounts: [account({ id: "a", balanceCents: 180_000_00n })],
      }),
    );
    expect(result.netCents).toBe(0n);
    expect(result.openingCents).toBe(180_000_00n);
    expect(result.closingCents).toBe(180_000_00n);
    expect(result.reconciles).toBe(true);
  });
});

describe("el cierre no altera nada", () => {
  it("computeClose es puro: la misma entrada da el mismo resultado", () => {
    const scenario = input({
      patrimonyNowCents: 100_000_00n,
      accounts: [account({ id: "a", balanceCents: 100_000_00n, withinCents: 10_000_00n })],
      movements: [movement({ id: "i", type: "INCOME", amountCents: 10_000_00n })],
    });
    expect(computeClose(scenario)).toEqual(computeClose(scenario));
  });

  it("no muta los movimientos que recibe", () => {
    const movements = [movement({ id: "i", type: "INCOME", amountCents: 10n })];
    const snapshot = JSON.stringify(movements, (_, value) =>
      typeof value === "bigint" ? value.toString() : value,
    );
    computeClose(input({ patrimonyNowCents: 10n, accounts: [account({ id: "a" })], movements }));
    expect(
      JSON.stringify(movements, (_, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    ).toBe(snapshot);
  });
});
