import { describe, expect, it } from "vitest";
import { formatCents } from "./domain";
import { formatCentsAR } from "./amount";
import {
  PROJECTION_HORIZON_DAYS,
  accountsMoneyCents,
  addCivilDays,
  archivedMoneyCents,
  buildTimeline,
  compareCommitments,
  computeCoverage,
  debtCents,
  groupForDueDate,
  nextCivilMonth,
  patrimonyCents,
  paymentState,
  projectBalance,
  selectCommitments,
  selectNowState,
  type ProjectionAccount,
  type UpcomingCommitment,
} from "./projection";
import { describeDueDateAR, describeGroup, describeMonthAR, weekdayAR } from "./upcomingDate";

const TODAY = "2026-07-24";

const account = (over: Partial<ProjectionAccount> & { id: string }): ProjectionAccount => ({
  name: "Cuenta",
  balanceCents: 0n,
  archived: false,
  ...over,
});

const payment = (over: Partial<UpcomingCommitment> & { id: string }): UpcomingCommitment => ({
  concept: "Servicio",
  dueOn: TODAY,
  amountCents: 10_000_00n,
  accountId: "acc",
  accountName: "Banco",
  accountBalanceCents: 100_000_00n,
  frequency: null,
  createdAtMs: 0,
  ...over,
});

// ---------------------------------------------------------------------------
// Definiciones
// ---------------------------------------------------------------------------

describe("definiciones: patrimonio y dinero en cuentas", () => {
  const accounts = [
    account({ id: "a", balanceCents: 300_000_00n }),
    account({ id: "b", balanceCents: 128_500_00n }),
    account({ id: "c", balanceCents: 40_000_00n, archived: true }),
  ];

  it("patrimonio suma todas las cuentas, activas y archivadas", () => {
    expect(patrimonyCents(accounts)).toBe(468_500_00n);
  });

  it("el dinero en cuentas excluye las archivadas: es la base operativa", () => {
    expect(accountsMoneyCents(accounts)).toBe(428_500_00n);
  });

  it("lo archivado se puede declarar aparte en vez de ocultarse", () => {
    expect(archivedMoneyCents(accounts)).toBe(40_000_00n);
    expect(accountsMoneyCents(accounts) + archivedMoneyCents(accounts)).toBe(patrimonyCents(accounts));
  });

  it("sin cuentas, ambas definiciones son cero y no rompen", () => {
    expect(patrimonyCents([])).toBe(0n);
    expect(accountsMoneyCents([])).toBe(0n);
  });

  it("una cuenta en negativo resta de verdad: no se recorta a cero", () => {
    expect(accountsMoneyCents([account({ id: "a", balanceCents: -5_000_00n })])).toBe(-5_000_00n);
  });
});

describe("definiciones: comprometido", () => {
  const payments = [
    payment({ id: "vencido", dueOn: "2026-07-20", amountCents: 18_500_00n }),
    payment({ id: "cerca", dueOn: "2026-07-30", amountCents: 31_500_00n }),
    payment({ id: "lejos", dueOn: "2026-10-01", amountCents: 90_000_00n }),
  ];

  it("incluye vencidos y lo que entra en el horizonte", () => {
    const selection = selectCommitments(payments, TODAY);
    expect(selection.included.map((item) => item.id)).toEqual(["vencido", "cerca"]);
    expect(selection.committedCents).toBe(50_000_00n);
  });

  it("no descuenta en silencio lo que quedó fuera del horizonte", () => {
    const selection = selectCommitments(payments, TODAY);
    expect(selection.excluded.map((item) => item.id)).toEqual(["lejos"]);
    expect(selection.excludedCents).toBe(90_000_00n);
  });

  it("separa lo vencido para que la pantalla pueda ser concreta", () => {
    const selection = selectCommitments(payments, TODAY);
    expect(selection.overdue.map((item) => item.id)).toEqual(["vencido"]);
    expect(selection.overdueCents).toBe(18_500_00n);
  });

  it("el horizonte por defecto son 30 días civiles", () => {
    expect(selectCommitments([], TODAY).horizonEnd).toBe(addCivilDays(TODAY, PROJECTION_HORIZON_DAYS));
  });

  it("sin compromisos el total es cero, no un supuesto", () => {
    const selection = selectCommitments([], TODAY);
    expect(selection.committedCents).toBe(0n);
    expect(selection.included).toEqual([]);
  });
});

describe("definiciones: proyectado", () => {
  it("proyectado = base − comprometido, y muestra qué incluyó", () => {
    const selection = selectCommitments(
      [payment({ id: "a", dueOn: "2026-07-30", amountCents: 96_000_00n })],
      TODAY,
    );
    const projection = projectBalance(428_500_00n, selection);
    expect(projection.projectedCents).toBe(332_500_00n);
    expect(projection.includedCount).toBe(1);
    expect(projection.baseCents - projection.committedCents).toBe(projection.projectedCents);
  });

  it("sin compromisos la proyección coincide con el dinero actual", () => {
    const projection = projectBalance(428_500_00n, selectCommitments([], TODAY));
    expect(projection.projectedCents).toBe(428_500_00n);
    expect(projection.hasCommitments).toBe(false);
  });

  it("puede quedar negativo y eso no se disimula", () => {
    const selection = selectCommitments([payment({ id: "a", amountCents: 50_000_00n })], TODAY);
    expect(projectBalance(31_500_00n, selection).projectedCents).toBe(-18_500_00n);
  });
});

describe("definiciones: cobertura", () => {
  it("cobertura total informa el excedente sin pasarse de 100", () => {
    const coverage = computeCoverage(120_000_00n, 96_000_00n);
    expect(coverage.percent).toBe(100);
    expect(coverage.missingCents).toBe(0n);
    expect(coverage.surplusCents).toBe(24_000_00n);
  });

  it("cobertura parcial dice cuánto falta", () => {
    const coverage = computeCoverage(80_000_00n, 96_000_00n);
    expect(coverage.coveredCents).toBe(80_000_00n);
    expect(coverage.missingCents).toBe(16_000_00n);
    expect(coverage.percent).toBe(83);
  });

  it("sin compromisos no divide por cero ni alarma", () => {
    const coverage = computeCoverage(0n, 0n);
    expect(coverage.percent).toBe(100);
    expect(coverage.hasCommitments).toBe(false);
    expect(coverage.missingCents).toBe(0n);
  });

  it("base negativa no produce cobertura negativa", () => {
    const coverage = computeCoverage(-5_000_00n, 96_000_00n);
    expect(coverage.percent).toBe(0);
    expect(coverage.coveredCents).toBe(0n);
    expect(coverage.missingCents).toBe(96_000_00n);
  });

  it("cobertura y faltante siempre reconcilian con el compromiso", () => {
    for (const base of [0n, 1_000_00n, 95_999_99n, 96_000_00n, 400_000_00n]) {
      const coverage = computeCoverage(base, 96_000_00n);
      expect(coverage.coveredCents + coverage.missingCents).toBe(96_000_00n);
    }
  });
});

// ---------------------------------------------------------------------------
// Línea temporal
// ---------------------------------------------------------------------------

describe("/proximo: agrupación temporal", () => {
  it("clasifica cada tramo por su distancia a hoy", () => {
    expect(groupForDueDate("2026-07-23", TODAY)).toBe("overdue");
    expect(groupForDueDate("2026-07-24", TODAY)).toBe("today");
    expect(groupForDueDate("2026-07-25", TODAY)).toBe("tomorrow");
    expect(groupForDueDate("2026-07-29", TODAY)).toBe("this-week");
    expect(groupForDueDate("2026-08-15", TODAY)).toBe("next-month");
    expect(groupForDueDate("2026-12-01", TODAY)).toBe("later");
  });

  it("lo que queda del mes empieza después de la semana", () => {
    expect(groupForDueDate("2026-07-12", "2026-07-05")).toBe("this-week");
    expect(groupForDueDate("2026-07-13", "2026-07-05")).toBe("rest-of-month");
    expect(groupForDueDate("2026-07-31", "2026-07-05")).toBe("rest-of-month");
  });

  it("la cercanía gana sobre el mes: a tres días es esta semana aunque cambie el mes", () => {
    expect(groupForDueDate("2026-08-01", "2026-07-30")).toBe("this-week");
  });

  it("el mes siguiente cruza el año correctamente", () => {
    expect(nextCivilMonth("2026-12-31")).toBe("2027-01");
    expect(groupForDueDate("2027-01-10", "2026-12-20")).toBe("next-month");
  });

  it("no devuelve grupos vacíos", () => {
    const timeline = buildTimeline([payment({ id: "a" })], TODAY, 100_000_00n);
    expect(timeline.groups.map((group) => group.id)).toEqual(["today"]);
  });

  it("sin pagos la línea temporal queda vacía y el saldo final es la base", () => {
    const timeline = buildTimeline([], TODAY, 100_000_00n);
    expect(timeline.groups).toEqual([]);
    expect(timeline.finalBalanceCents).toBe(100_000_00n);
  });
});

describe("/proximo: orden estable", () => {
  it("ordena por fecha, después por importe y después por creación", () => {
    const items = [
      payment({ id: "c", dueOn: "2026-07-26", amountCents: 5_000_00n, createdAtMs: 30 }),
      payment({ id: "b", dueOn: "2026-07-25", amountCents: 5_000_00n, createdAtMs: 20 }),
      payment({ id: "a", dueOn: "2026-07-25", amountCents: 9_000_00n, createdAtMs: 10 }),
    ];
    expect([...items].sort(compareCommitments).map((item) => item.id)).toEqual(["a", "b", "c"]);
  });

  it("con fecha, importe y creación iguales desempata por id: nunca dos órdenes", () => {
    const left = payment({ id: "x" });
    const right = payment({ id: "y" });
    expect(compareCommitments(left, right)).toBeLessThan(0);
    expect(compareCommitments(right, left)).toBeGreaterThan(0);
    expect(compareCommitments(left, left)).toBe(0);
  });
});

describe("/proximo: saldo posterior", () => {
  const payments = [
    payment({ id: "a", dueOn: "2026-07-20", amountCents: 18_500_00n }),
    payment({ id: "b", dueOn: "2026-07-25", amountCents: 31_500_00n }),
    payment({ id: "c", dueOn: "2026-08-05", amountCents: 46_000_00n }),
  ];

  it("descuenta en orden cronológico acumulado", () => {
    const timeline = buildTimeline(payments, TODAY, 300_000_00n);
    expect(timeline.entries.map((entry) => entry.balanceAfterCents)).toEqual([
      281_500_00n,
      250_000_00n,
      204_000_00n,
    ]);
  });

  it("cada saldo posterior reconcilia con base menos la suma acumulada", () => {
    const timeline = buildTimeline(payments, TODAY, 300_000_00n);
    let accumulated = 0n;
    for (const entry of timeline.entries) {
      accumulated += entry.payment.amountCents;
      expect(entry.balanceAfterCents).toBe(300_000_00n - accumulated);
    }
    expect(timeline.finalBalanceCents).toBe(300_000_00n - timeline.pendingCents);
  });

  it("el saldo del grupo es el del último pago del grupo", () => {
    const timeline = buildTimeline(payments, TODAY, 300_000_00n);
    for (const group of timeline.groups) {
      expect(group.balanceAfterCents).toBe(group.entries[group.entries.length - 1]!.balanceAfterCents);
    }
  });

  it("si el dinero no alcanza, el saldo posterior queda negativo", () => {
    const timeline = buildTimeline(payments, TODAY, 30_000_00n);
    expect(timeline.finalBalanceCents).toBe(-66_000_00n);
    expect(timeline.entries[0]!.balanceAfterCents).toBe(11_500_00n);
    expect(timeline.entries[1]!.balanceAfterCents).toBe(-20_000_00n);
  });

  it("solo descuenta lo pendiente: un pagado no se pasa a esta lista", () => {
    // La capa de datos entrega únicamente PENDING; el cálculo respeta lo que recibe.
    const timeline = buildTimeline([payments[1]!], TODAY, 300_000_00n);
    expect(timeline.pendingCents).toBe(31_500_00n);
  });
});

describe("/proximo: estado de cada pago", () => {
  it("distingue vencido, vence hoy, pendiente y pagado", () => {
    expect(paymentState("2026-07-20", TODAY, "PENDING")).toBe("overdue");
    expect(paymentState(TODAY, TODAY, "PENDING")).toBe("due-today");
    expect(paymentState("2026-08-01", TODAY, "PENDING")).toBe("pending");
    expect(paymentState("2026-07-20", TODAY, "PAID")).toBe("paid");
  });

  it("un pagado nunca vuelve a leerse como vencido", () => {
    expect(paymentState("2020-01-01", TODAY, "PAID")).toBe("paid");
  });
});

// ---------------------------------------------------------------------------
// Estado de /ahora
// ---------------------------------------------------------------------------

describe("/ahora: un solo estado por prioridad", () => {
  const base = {
    hasAccounts: true,
    overdueCount: 0,
    coverage: computeCoverage(400_000_00n, 96_000_00n),
    hasMovements: true,
    hasCommitments: true,
  };

  it("sin cuentas no hay lectura financiera", () => {
    expect(selectNowState({ ...base, hasAccounts: false, overdueCount: 3 })).toBe("no-accounts");
  });

  it("un vencido gana sobre cualquier otra señal", () => {
    expect(selectNowState({ ...base, overdueCount: 1 })).toBe("attention");
  });

  it("cobertura insuficiente se declara antes que la falta de datos", () => {
    expect(
      selectNowState({ ...base, coverage: computeCoverage(10_000_00n, 96_000_00n), hasMovements: false }),
    ).toBe("uncovered");
  });

  it("sin movimientos la lectura es incompleta, no estable", () => {
    expect(selectNowState({ ...base, hasMovements: false })).toBe("incomplete");
  });

  it("sin próximos pagos cargados tampoco se afirma tranquilidad plena", () => {
    expect(
      selectNowState({ ...base, hasCommitments: false, coverage: computeCoverage(400_000_00n, 0n) }),
    ).toBe("incomplete");
  });

  it("con datos suficientes y todo cubierto, el estado es estable", () => {
    expect(selectNowState(base)).toBe("stable");
  });
});

// ---------------------------------------------------------------------------
// Fechas e importes
// ---------------------------------------------------------------------------

describe("fechas civiles argentinas", () => {
  it("usa hoy, mañana y ayer antes que la fecha larga", () => {
    expect(describeDueDateAR(TODAY, TODAY)).toBe("Hoy");
    expect(describeDueDateAR("2026-07-25", TODAY)).toBe("Mañana");
    expect(describeDueDateAR("2026-07-23", TODAY)).toBe("Ayer");
  });

  it("escribe la fecha larga con día de semana y sin año cuando es obvio", () => {
    expect(describeDueDateAR("2026-07-31", TODAY)).toBe("Viernes 31 de julio");
  });

  it("agrega el año cuando deja de ser obvio", () => {
    expect(describeDueDateAR("2027-01-05", TODAY)).toBe("Martes 5 de enero de 2027");
  });

  it("nombra meses completos", () => {
    expect(describeMonthAR("2026-08")).toBe("Agosto de 2026");
    expect(describeMonthAR("2026-08-15")).toBe("Agosto de 2026");
  });

  it("deriva el día de semana sin depender del huso del navegador", () => {
    expect(weekdayAR("2026-07-24")).toBe("viernes");
  });

  it("los títulos de tramo nombran su mes real", () => {
    expect(describeGroup("overdue", TODAY)).toBe("Vencidos");
    expect(describeGroup("rest-of-month", TODAY)).toBe("Resto de julio");
    expect(describeGroup("next-month", TODAY)).toBe("Agosto de 2026");
    expect(describeGroup("later", TODAY)).toBe("Más adelante");
  });
});

describe("importes: un solo formateador en todo el producto", () => {
  it("formatCents y formatCentsAR devuelven el mismo texto", () => {
    for (const cents of [0n, 99n, 30_000n, 1_250_000n, 1_250_050n, 150_000_000n]) {
      expect(formatCents(cents)).toBe(formatCentsAR(cents));
    }
  });

  it("mantiene los dos decimales en vez de recortarlos", () => {
    expect(formatCents(1_250_050n)).toBe("12.500,50");
  });

  it("no pierde precisión con importes que exceden el entero seguro", () => {
    // Number(9007199254740993n) redondea a ...992: el formateador trabaja en bigint.
    expect(formatCents(9_007_199_254_740_993n)).toBe("90.071.992.547.409,93");
  });
});

// ---------------------------------------------------------------------------
// Deudas: una tarjeta de crédito no es un lugar donde hay plata.
// ---------------------------------------------------------------------------

describe("cuentas de deuda", () => {
  const cuenta = (id: string, balanceCents: bigint, extra: Partial<ProjectionAccount> = {}): ProjectionAccount => ({
    id,
    name: id,
    balanceCents,
    archived: false,
    ...extra,
  });

  /**
   * El error que esta distinción evita es doble: si el saldo de la tarjeta
   * entrara en la base, gastar con ella descontaría plata que todavía está en el
   * banco, y pagar el resumen la volvería a descontar.
   */
  it("la deuda no entra en la base sobre la que se proyecta", () => {
    const cuentas = [cuenta("banco", 500_000n), cuenta("visa", -240_000n, { liability: true })];
    expect(accountsMoneyCents(cuentas)).toBe(500_000n);
  });

  it("la deuda sí resta del patrimonio, con su signo natural", () => {
    const cuentas = [cuenta("banco", 500_000n), cuenta("visa", -240_000n, { liability: true })];
    expect(patrimonyCents(cuentas)).toBe(260_000n);
  });

  it("informa lo que se debe como número positivo", () => {
    const cuentas = [cuenta("banco", 500_000n), cuenta("visa", -240_000n, { liability: true })];
    expect(debtCents(cuentas)).toBe(240_000n);
  });

  it("una tarjeta pagada de más deja saldo a favor y no se recorta en cero", () => {
    expect(debtCents([cuenta("visa", 5_000n, { liability: true })])).toBe(-5_000n);
  });

  /**
   * Archivar una tarjeta no cancela lo que se debe en ella. Ocultarlo sería un
   * alivio falso.
   */
  it("una deuda archivada sigue contando como deuda", () => {
    const cuentas = [cuenta("visa", -240_000n, { liability: true, archived: true })];
    expect(debtCents(cuentas)).toBe(240_000n);
    expect(patrimonyCents(cuentas)).toBe(-240_000n);
    expect(accountsMoneyCents(cuentas)).toBe(0n);
  });

  it("sin deudas declaradas, nada cambia respecto de antes", () => {
    const cuentas = [cuenta("banco", 500_000n), cuenta("efectivo", 20_000n)];
    expect(accountsMoneyCents(cuentas)).toBe(520_000n);
    expect(patrimonyCents(cuentas)).toBe(520_000n);
    expect(debtCents(cuentas)).toBe(0n);
  });
});
