import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  applyPostings,
  createPostings,
  paymentConversionDecision,
  reversePostings,
} from "./domain";
import { resilientList, resilientRead } from "./analysis";
import {
  accountsMoneyCents,
  buildTimeline,
  computeCoverage,
  nextMonthSameDay,
  projectBalance,
  selectCommitments,
  type ProjectionAccount,
  type UpcomingCommitment,
} from "./projection";

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");
const action = read("src/app/actions/finance.ts");

const TODAY = "2026-07-24";

// ---------------------------------------------------------------------------
// Confirmación de pago
// ---------------------------------------------------------------------------

describe("confirmación: idempotencia real", () => {
  it("un pago pendiente sin movimiento se convierte una vez", () => {
    expect(paymentConversionDecision("PENDING", null)).toBe("CREATE");
  });

  it("reintentar un pago ya confirmado devuelve el existente en vez de crear otro", () => {
    expect(paymentConversionDecision("PAID", "tx-1")).toBe("RETURN_EXISTING");
  });

  it("un estado inconsistente no se convierte a ciegas", () => {
    expect(() => paymentConversionDecision("PAID", null)).toThrow();
    expect(() => paymentConversionDecision("PENDING", "tx-1")).toThrow();
  });

  it("la clave de idempotencia es del pago, no del formulario", () => {
    expect(action).toContain("idempotencyKey: `upcoming-payment:${payment.id}`");
  });

  it("la carrera contra otro envío se resuelve sin duplicar el gasto", () => {
    expect(action).toContain('error.code === "P2002"');
    expect(action).toContain("Ya estaba confirmado: no se creó otro gasto.");
  });

  it("el gasto y el cambio de estado ocurren en una sola transacción", () => {
    expect(action).toContain("await db.$transaction(async (tx) => {");
    expect(action).toContain('data: { status: "PAID", transactionId: movement.id }');
  });

  it("no se puede confirmar con fecha futura", () => {
    expect(action).toContain("No se puede confirmar un pago con fecha futura.");
  });

  it("el éxito nombra el importe y la cuenta reales", () => {
    expect(action).toContain('message: "Pago confirmado."');
    expect(action).toContain("Salieron $${formatCentsAR(result.amountCents)} de ${result.accountName}.");
  });
});

describe("confirmación: el saldo se descuenta una sola vez", () => {
  it("el gasto confirmado resta del saldo de la cuenta prevista", () => {
    const postings = createPostings("EXPENSE", 18_500_00n, "banco");
    expect(applyPostings({ banco: 100_000_00n }, postings)).toEqual({ banco: 81_500_00n });
  });

  it("anular el gasto confirmado devuelve el saldo exacto", () => {
    const postings = createPostings("EXPENSE", 18_500_00n, "banco");
    const after = applyPostings({ banco: 100_000_00n }, postings);
    expect(applyPostings(after, reversePostings(postings))).toEqual({ banco: 100_000_00n });
  });

  it("el pago confirmado sale de pendientes: deja de descontarse en la proyección", () => {
    const pending: UpcomingCommitment[] = [
      {
        id: "internet",
        concept: "Internet",
        dueOn: "2026-07-25",
        amountCents: 18_500_00n,
        accountId: "banco",
        accountName: "Banco",
        accountBalanceCents: 100_000_00n,
        frequency: null,
        createdAtMs: 0,
      },
    ];

    const before = projectBalance(100_000_00n, selectCommitments(pending, TODAY));
    // Tras confirmar: el saldo bajó 18.500 y el pago ya no está pendiente.
    const after = projectBalance(81_500_00n, selectCommitments([], TODAY));

    expect(before.projectedCents).toBe(81_500_00n);
    expect(after.projectedCents).toBe(81_500_00n);
    expect(after.committedCents).toBe(0n);
  });
});

// ---------------------------------------------------------------------------
// Repetición manual
// ---------------------------------------------------------------------------

describe("repetición: un mes más adelante, siempre con confirmación humana", () => {
  it("mantiene el día cuando existe en el mes destino", () => {
    expect(nextMonthSameDay("2026-07-10")).toBe("2026-08-10");
  });

  it("acota el día al último real en vez de inventar una fecha", () => {
    expect(nextMonthSameDay("2026-01-31")).toBe("2026-02-28");
    expect(nextMonthSameDay("2026-03-31")).toBe("2026-04-30");
  });

  it("cruza el año", () => {
    expect(nextMonthSameDay("2026-12-15")).toBe("2027-01-15");
  });

  it("crea un pago PENDING: nunca un movimiento", () => {
    expect(action).toContain("db.upcomingPayment.create");
    expect(action).toContain("Vas a tener que confirmarlo cuando lo pagues.");
  });

  it("no duplica si ya existe el mismo pago para esa fecha", () => {
    expect(action).toContain('message: "Ya existe ese pago previsto."');
  });
});

// ---------------------------------------------------------------------------
// Reconciliación
// ---------------------------------------------------------------------------

describe("reconciliación: proyección, cobertura y saldo posterior cierran", () => {
  const accounts: ProjectionAccount[] = [
    { id: "banco", name: "Banco", balanceCents: 300_000_00n, archived: false },
    { id: "billetera", name: "Billetera", balanceCents: 96_500_00n, archived: false },
    { id: "efectivo", name: "Efectivo", balanceCents: 32_000_00n, archived: false },
  ];
  const payment = (id: string, dueOn: string, cents: bigint): UpcomingCommitment => ({
    id,
    concept: id,
    dueOn,
    amountCents: cents,
    accountId: "banco",
    accountName: "Banco",
    accountBalanceCents: 300_000_00n,
    frequency: null,
    createdAtMs: 0,
  });
  const pending = [
    payment("gimnasio", "2026-07-24", 19_500_00n),
    payment("internet", "2026-07-25", 18_500_00n),
    payment("visa", "2026-07-31", 46_000_00n),
    payment("alquiler", "2026-08-01", 12_000_00n),
  ];

  const base = accountsMoneyCents(accounts);
  const selection = selectCommitments(pending, TODAY);
  const projection = projectBalance(base, selection);
  const coverage = computeCoverage(base, selection.committedCents);
  const timeline = buildTimeline(pending, TODAY, base);

  it("proyectado = base elegida − comprometido", () => {
    expect(base).toBe(428_500_00n);
    expect(projection.committedCents).toBe(96_000_00n);
    expect(projection.projectedCents).toBe(332_500_00n);
    expect(projection.baseCents - projection.committedCents).toBe(projection.projectedCents);
  });

  it("el saldo posterior del último pago coincide con el proyectado", () => {
    expect(timeline.finalBalanceCents).toBe(projection.projectedCents);
  });

  it("posterior n = base − suma acumulada hasta n", () => {
    let accumulated = 0n;
    for (const entry of timeline.entries) {
      accumulated += entry.payment.amountCents;
      expect(entry.balanceAfterCents).toBe(base - accumulated);
    }
  });

  it("cobertura + faltante = comprometido, sin excedente escondido", () => {
    expect(coverage.coveredCents + coverage.missingCents).toBe(projection.committedCents);
    expect(coverage.surplusCents).toBe(projection.projectedCents);
  });
});

// ---------------------------------------------------------------------------
// Resiliencia
// ---------------------------------------------------------------------------

describe("resiliencia: lo secundario degrada, lo central rompe", () => {
  it("una lectura secundaria fallida devuelve null y se puede declarar", async () => {
    expect(await resilientRead(async () => { throw new Error("caída"); })).toBeNull();
  });

  it("una lectura secundaria vacía no se confunde con una fallida", async () => {
    expect(await resilientRead(async () => [])).toEqual([]);
  });

  it("resilientList sigue degradando a lista vacía donde el vacío alcanza", async () => {
    expect(await resilientList(async () => { throw new Error("caída"); })).toEqual([]);
  });

  it("/ahora protege los movimientos recientes, no el patrimonio", () => {
    const data = read("src/lib/finance/data.ts");
    expect(data).toContain("resilientRead(() =>");
    expect(data).toContain("db.transaction.findMany({");
    // Las cuentas se leen sin red de contención: si fallan, la pantalla rompe.
    expect(data).not.toContain("resilientRead(() => getAccountsWithBalances())");
  });

  it("la degradación se dice con texto, no en silencio", () => {
    expect(read("src/features/now/data/getNowModel.ts")).toContain(
      "No pudimos cargar los movimientos recientes. Tu saldo principal sigue disponible.",
    );
  });
});
