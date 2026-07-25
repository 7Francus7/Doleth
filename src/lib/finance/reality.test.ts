import { describe, expect, it } from "vitest";
import {
  completenessFor,
  computeReality,
  splitCommitments,
  type RealityAccount,
  type RealityInput,
  type RealityMovement,
} from "./reality";
import type { UpcomingCommitment } from "./projection";

const TODAY = "2026-07-24";
const PERIOD = { start: "2026-07-01", end: "2026-07-31", days: 31 };

const account = (over: Partial<RealityAccount> & { id: string }): RealityAccount => ({
  name: "Cuenta",
  type: "BANK",
  balanceCents: 0n,
  initialBalanceCents: 0n,
  archived: false,
  lastActivityOn: TODAY,
  movementCount: 1,
  ...over,
});

const movement = (over: Partial<RealityMovement> & { id: string }): RealityMovement => ({
  type: "EXPENSE",
  amountCents: 0n,
  occurredOn: "2026-07-20",
  voided: false,
  label: "Movimiento",
  accountName: "Banco",
  ...over,
});

const commitment = (over: Partial<UpcomingCommitment> & { id: string }): UpcomingCommitment => ({
  concept: "Servicio",
  dueOn: "2026-07-28",
  amountCents: 10_000_00n,
  accountId: "a",
  accountName: "Banco",
  accountBalanceCents: 100_000_00n,
  frequency: null,
  createdAtMs: 0,
  ...over,
});

const input = (over: Partial<RealityInput> = {}): RealityInput => ({
  today: TODAY,
  period: PERIOD,
  accounts: [],
  investments: [],
  commitments: [],
  movements: [],
  ...over,
});

// ---------------------------------------------------------------------------
// Patrimonio
// ---------------------------------------------------------------------------

describe("patrimonio", () => {
  it("sin cuentas no hay patrimonio ni composición", () => {
    const result = computeReality(input());
    expect(result.patrimonyCents).toBe(0n);
    expect(result.completeness).toBe("empty");
    expect(result.activeAccounts).toEqual([]);
  });

  it("una sola cuenta: el patrimonio es su saldo", () => {
    const result = computeReality(
      input({ accounts: [account({ id: "a", balanceCents: 180_000_00n })] }),
    );
    expect(result.patrimonyCents).toBe(180_000_00n);
    expect(result.activeCount).toBe(1);
  });

  it("reconcilia: patrimonio = activas + archivadas", () => {
    const result = computeReality(
      input({
        accounts: [
          account({ id: "a", balanceCents: 33_000_00n }),
          account({ id: "b", balanceCents: -7_000_00n }),
          account({ id: "c", balanceCents: 12_000_00n, archived: true }),
        ],
      }),
    );
    expect(result.activeCents + result.archivedCents).toBe(result.patrimonyCents);
    expect(result.patrimonyCents).toBe(38_000_00n);
  });

  it("las archivadas se separan pero siguen dentro del patrimonio", () => {
    const result = computeReality(
      input({
        accounts: [
          account({ id: "a", balanceCents: 100_000_00n }),
          account({ id: "b", balanceCents: 40_000_00n, archived: true }),
        ],
      }),
    );
    expect(result.activeCents).toBe(100_000_00n);
    expect(result.archivedCents).toBe(40_000_00n);
    expect(result.patrimonyCents).toBe(140_000_00n);
    expect(result.archivedAccounts).toHaveLength(1);
    expect(result.activeAccounts).toHaveLength(1);
  });
});

describe("inversiones", () => {
  it("no se suman al patrimonio: dominio separado", () => {
    const result = computeReality(
      input({
        accounts: [account({ id: "a", balanceCents: 100_000_00n })],
        investments: [{ id: "i", name: "Fondo", currentValueCents: 305_000_00n }],
      }),
    );
    expect(result.patrimonyCents).toBe(100_000_00n);
    expect(result.investedCents).toBe(305_000_00n);
  });

  it("sin doble conteo: agregar una inversión no mueve el patrimonio", () => {
    const accounts = [account({ id: "a", balanceCents: 100_000_00n })];
    const without = computeReality(input({ accounts }));
    const with_ = computeReality(
      input({ accounts, investments: [{ id: "i", name: "Fondo", currentValueCents: 999_000_00n }] }),
    );
    expect(with_.patrimonyCents).toBe(without.patrimonyCents);
  });

  it("una lectura caída no es 'no hay inversiones'", () => {
    const result = computeReality(
      input({ accounts: [account({ id: "a", balanceCents: 1n })], investments: null }),
    );
    expect(result.investmentsAvailable).toBe(false);
    expect(result.investedCents).toBe(0n);
    expect(result.investmentCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Compromisos
// ---------------------------------------------------------------------------

describe("compromisos", () => {
  const payments = [
    commitment({ id: "vencido", dueOn: "2026-07-21", amountCents: 41_800_00n }),
    commitment({ id: "cerca", dueOn: "2026-07-30", amountCents: 28_400_00n }),
    commitment({ id: "horizonte", dueOn: "2026-08-23", amountCents: 54_200_00n }),
    commitment({ id: "lejos", dueOn: "2026-09-10", amountCents: 73_000_00n }),
  ];

  it("separa vencidos, horizonte y lo que queda afuera", () => {
    const split = splitCommitments(payments, TODAY);
    expect(split.overdueCount).toBe(1);
    expect(split.overdueCents).toBe(41_800_00n);
    expect(split.horizonCount).toBe(2);
    expect(split.horizonCents).toBe(82_600_00n);
    expect(split.beyondCount).toBe(1);
    expect(split.beyondCents).toBe(73_000_00n);
  });

  it("el total reconcilia con las tres partes", () => {
    const split = splitCommitments(payments, TODAY);
    expect(split.overdueCents + split.horizonCents + split.beyondCents).toBe(split.totalCents);
    expect(split.totalCount).toBe(4);
  });

  it("el horizonte es el mismo que proyecta /ahora: 30 días", () => {
    expect(splitCommitments([], TODAY).horizonDays).toBe(30);
    expect(splitCommitments([], TODAY).horizonEnd).toBe("2026-08-23");
  });

  it("no se restan del patrimonio", () => {
    const result = computeReality(
      input({
        accounts: [account({ id: "a", balanceCents: 100_000_00n })],
        commitments: payments,
      }),
    );
    expect(result.patrimonyCents).toBe(100_000_00n);
    expect(result.commitments.totalCents).toBe(197_400_00n);
  });

  it("una lectura caída se declara en vez de mostrarse como cero", () => {
    const result = computeReality(
      input({ accounts: [account({ id: "a", balanceCents: 1n })], commitments: null }),
    );
    expect(result.commitmentsAvailable).toBe(false);
    expect(result.unverifiableSignals).toEqual(["upcoming", "reviewed-overdue"]);
  });
});

// ---------------------------------------------------------------------------
// Actividad del período
// ---------------------------------------------------------------------------

describe("actividad del período", () => {
  const base = { accounts: [account({ id: "a", balanceCents: 100_000_00n })] };

  it("ingresos y gastos vigentes componen el resultado", () => {
    const result = computeReality(
      input({
        ...base,
        movements: [
          movement({ id: "i", type: "INCOME", amountCents: 900_000_00n }),
          movement({ id: "g", type: "EXPENSE", amountCents: 448_700_00n }),
        ],
      }),
    );
    expect(result.activity.incomeCents).toBe(900_000_00n);
    expect(result.activity.expenseCents).toBe(448_700_00n);
    expect(result.activity.netCents).toBe(451_300_00n);
  });

  it("una transferencia no altera el resultado y se cuenta aparte", () => {
    const result = computeReality(
      input({
        ...base,
        movements: [movement({ id: "t", type: "TRANSFER", amountCents: 50_000_00n })],
      }),
    );
    expect(result.activity.netCents).toBe(0n);
    expect(result.activity.transferCents).toBe(50_000_00n);
    expect(result.activity.transferCount).toBe(1);
    expect(result.activity.movementCount).toBe(0);
  });

  it("un anulado no cuenta pero se declara", () => {
    const result = computeReality(
      input({
        ...base,
        movements: [movement({ id: "v", amountCents: 99_000_00n, voided: true })],
      }),
    );
    expect(result.activity.expenseCents).toBe(0n);
    expect(result.activity.voidedCount).toBe(1);
  });

  it("una corrección pesa una sola vez: el original está anulado", () => {
    const result = computeReality(
      input({
        ...base,
        movements: [
          movement({ id: "original", amountCents: 24_300_00n, voided: true, corrected: true }),
          movement({ id: "reemplazo", amountCents: 18_000_00n }),
        ],
      }),
    );
    expect(result.activity.expenseCents).toBe(18_000_00n);
    expect(result.activity.movementCount).toBe(1);
  });

  it("los movimientos fuera del período no entran", () => {
    const result = computeReality(
      input({
        ...base,
        movements: [
          movement({ id: "dentro", amountCents: 10_000_00n, occurredOn: "2026-07-05" }),
          movement({ id: "antes", amountCents: 90_000_00n, occurredOn: "2026-06-30" }),
        ],
      }),
    );
    expect(result.activity.expenseCents).toBe(10_000_00n);
  });

});

// ---------------------------------------------------------------------------
// Participación
// ---------------------------------------------------------------------------

describe("participación de cada cuenta", () => {
  it("se calcula sobre el dinero operativo", () => {
    const result = computeReality(
      input({
        accounts: [
          account({ id: "a", balanceCents: 412_000_00n }),
          account({ id: "b", balanceCents: 86_500_00n }),
        ],
      }),
    );
    expect(result.activeAccounts.map((item) => item.sharePercent)).toEqual([82, 17]);
  });

  it("sin denominador honesto no hay porcentaje", () => {
    const result = computeReality(
      input({
        accounts: [
          account({ id: "a", balanceCents: -5_000_00n }),
          account({ id: "b", balanceCents: 5_000_00n }),
        ],
      }),
    );
    expect(result.activeAccounts[0]!.sharePercent).toBeNull();
  });

  it("las archivadas no compiten por la participación del dinero operativo", () => {
    const result = computeReality(
      input({
        accounts: [
          account({ id: "a", balanceCents: 100_000_00n }),
          account({ id: "b", balanceCents: 100_000_00n, archived: true }),
        ],
      }),
    );
    expect(result.activeAccounts[0]!.sharePercent).toBe(100);
    expect(result.archivedAccounts[0]!.sharePercent).toBeNull();
  });

  it("una cuenta sin movimientos se marca como saldo inicial solamente", () => {
    const result = computeReality(
      input({
        accounts: [account({ id: "a", balanceCents: 10n, movementCount: 0, lastActivityOn: null })],
      }),
    );
    expect(result.activeAccounts[0]!.onlyInitialBalance).toBe(true);
    expect(result.activeAccounts[0]!.lastActivityOn).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Calidad de la información
// ---------------------------------------------------------------------------

describe("señales de calidad", () => {
  const full = () =>
    input({
      accounts: [account({ id: "a", balanceCents: 100_000_00n, initialBalanceCents: 50_000_00n })],
      investments: [],
      commitments: [commitment({ id: "p", dueOn: "2026-07-30" })],
      movements: [
        movement({ id: "i", type: "INCOME", amountCents: 900_000_00n }),
        movement({ id: "g", type: "EXPENSE", amountCents: 100_00n }),
      ],
    });

  it("son seis señales explícitas, no un porcentaje", () => {
    const result = computeReality(full());
    expect(result.totalSignals).toBe(6);
    expect(result.signals.map((signal) => signal.id)).toEqual([
      "active-account",
      "accounts-with-origin",
      "movements",
      "income",
      "upcoming",
      "reviewed-overdue",
    ]);
  });

  it("sin pagos cargados, 'sin vencidos' no se cumple por ausencia de datos", () => {
    const result = computeReality({ ...full(), commitments: [] });
    expect(result.signals.map((signal) => signal.id)).not.toContain("reviewed-overdue");
    expect(result.totalSignals).toBe(5);
    expect(result.metSignals).toBe(4);
  });

  it("todas cumplidas: completa para análisis", () => {
    const result = computeReality(full());
    expect(result.metSignals).toBe(6);
    expect(result.completeness).toBe("analysis-ready");
  });

  it("señal de cuenta activa: sin ninguna activa la lectura queda vacía", () => {
    const result = computeReality(
      input({ accounts: [account({ id: "a", balanceCents: 10n, archived: true })] }),
    );
    expect(result.signals.find((signal) => signal.id === "active-account")?.met).toBe(false);
    expect(result.completeness).toBe("empty");
  });

  it("señal de origen: una cuenta en cero y sin movimientos no la cumple", () => {
    const result = computeReality(
      input({
        accounts: [
          account({ id: "a", balanceCents: 100_00n, initialBalanceCents: 100_00n }),
          account({ id: "b", balanceCents: 0n, initialBalanceCents: 0n, movementCount: 0 }),
        ],
      }),
    );
    expect(result.signals.find((signal) => signal.id === "accounts-with-origin")?.met).toBe(false);
  });

  it("señal de movimientos: un mes sin movimientos no la cumple", () => {
    const result = computeReality(
      input({ accounts: [account({ id: "a", balanceCents: 10n, initialBalanceCents: 10n })] }),
    );
    expect(result.signals.find((signal) => signal.id === "movements")?.met).toBe(false);
  });

  it("señal de ingresos: no asume que la persona no tiene ingresos", () => {
    const result = computeReality(
      input({
        accounts: [account({ id: "a", balanceCents: 10n, initialBalanceCents: 10n })],
        movements: [movement({ id: "g", amountCents: 1_000_00n })],
      }),
    );
    expect(result.signals.find((signal) => signal.id === "income")?.met).toBe(false);
  });

  it("señal de compromisos: sin pagos cargados no se cumple", () => {
    const result = computeReality(input({ accounts: [account({ id: "a", balanceCents: 10n })] }));
    expect(result.signals.find((signal) => signal.id === "upcoming")?.met).toBe(false);
  });

  it("solo saldo inicial: dos de cinco señales, información inicial", () => {
    const result = computeReality(
      input({
        accounts: [
          account({ id: "a", balanceCents: 180_000_00n, initialBalanceCents: 180_000_00n, movementCount: 0, lastActivityOn: null }),
        ],
      }),
    );
    expect(result.metSignals).toBe(2);
    expect(result.totalSignals).toBe(5);
    expect(result.completeness).toBe("initial");
  });

  it("señal de vencidos: un vencido sin confirmar la deja sin cumplir", () => {
    const result = computeReality(
      input({
        accounts: [account({ id: "a", balanceCents: 10n })],
        commitments: [commitment({ id: "v", dueOn: "2026-07-01" })],
      }),
    );
    expect(result.signals.find((signal) => signal.id === "reviewed-overdue")?.met).toBe(false);
  });

  it("una lectura caída saca sus señales del denominador, no las cuenta como faltantes", () => {
    const result = computeReality({ ...full(), commitments: null });
    expect(result.totalSignals).toBe(4);
    expect(result.metSignals).toBe(4);
    expect(result.completeness).toBe("analysis-ready");
  });
});

describe("estados de la representación", () => {
  it("sin cuenta activa: vacía", () => {
    expect(completenessFor(false, 5, 6)).toBe("empty");
  });
  it("hasta la mitad de las señales: inicial", () => {
    expect(completenessFor(true, 2, 6)).toBe("initial");
  });
  it("mitad o más: parcial", () => {
    expect(completenessFor(true, 3, 6)).toBe("partial");
    expect(completenessFor(true, 4, 6)).toBe("partial");
  });
  it("una señal para el final: suficiente", () => {
    expect(completenessFor(true, 5, 6)).toBe("sufficient");
  });
  it("todas: completa para análisis", () => {
    expect(completenessFor(true, 6, 6)).toBe("analysis-ready");
  });
  it("el estado se adapta al denominador realmente verificable", () => {
    expect(completenessFor(true, 4, 4)).toBe("analysis-ready");
    expect(completenessFor(true, 3, 4)).toBe("sufficient");
    expect(completenessFor(true, 2, 4)).toBe("partial");
  });
});
