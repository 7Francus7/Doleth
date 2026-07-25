import "server-only";
import { getDb } from "../db";
import { formatCents, monthBounds, summarizeMonth, todayInArgentina } from "./domain";
import { resilientList, resilientRead, type AnalysisMovement } from "./analysis";
import {
  equivalentMonthPeriods,
  precedingPeriod,
  recentPeriod,
  type CategorizedMovement,
  type Period,
} from "./comparison";
import {
  accountsMoneyCents,
  selectCommitments,
  type UpcomingCommitment,
} from "./projection";

/**
 * Traduce un `UpcomingPayment` de Prisma al compromiso puro que consume
 * `projection.ts`. El saldo de la cuenta prevista viaja con el pago para que la
 * confirmación pueda mostrar el saldo antes y después sin otra consulta.
 */
function toCommitment(
  payment: {
    id: string;
    concept: string;
    dueOn: Date;
    estimatedCents: bigint;
    frequency: string | null;
    plannedAccountId: string;
    plannedAccount: { name: string };
    createdAt: Date;
  },
  balanceByAccount: ReadonlyMap<string, bigint>,
): UpcomingCommitment {
  return {
    id: payment.id,
    concept: payment.concept,
    dueOn: payment.dueOn.toISOString().slice(0, 10),
    amountCents: payment.estimatedCents,
    accountId: payment.plannedAccountId,
    accountName: payment.plannedAccount.name,
    accountBalanceCents: balanceByAccount.get(payment.plannedAccountId) ?? 0n,
    frequency: payment.frequency,
    createdAtMs: payment.createdAt.getTime(),
  };
}

export async function getAccountsWithBalances() {
  const db = getDb();
  const [accounts, totals] = await Promise.all([
    db.account.findMany({ orderBy: [{ status: "asc" }, { createdAt: "asc" }] }),
    db.ledgerEntry.groupBy({
      by: ["accountId"],
      where: { transaction: { voidedAt: null } },
      _sum: { amountCents: true },
    }),
  ]);
  const totalsByAccount = new Map(totals.map((row) => [row.accountId, row._sum.amountCents ?? 0n]));

  return accounts.map((account) => ({
    id: account.id,
    name: account.name,
    type: account.type,
    currency: account.currency,
    status: account.status,
    initialBalanceCents: account.initialBalanceCents,
    balanceCents: account.initialBalanceCents + (totalsByAccount.get(account.id) ?? 0n),
  }));
}

export async function getMovementFormData() {
  const db = getDb();
  const [accounts, categories] = await Promise.all([
    db.account.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    db.category.findMany({ orderBy: [{ kind: "asc" }, { name: "asc" }] }),
  ]);
  return {
    accounts: accounts.map(({ id, name, currency }) => ({ id, name, currency })),
    categories: categories.map(({ id, name, kind }) => ({ id, name, kind })),
    today: todayInArgentina(),
  };
}

export interface RecentMovement {
  id: string;
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  description: string;
  amountCents: bigint;
  occurredOn: string;
  accountName: string;
  voided: boolean;
  /** El original de una corrección: sigue en el historial, sin efecto vigente. */
  corrected: boolean;
}

export interface NowData {
  today: string;
  accounts: {
    id: string;
    name: string;
    type: string;
    balanceCents: bigint;
    archived: boolean;
  }[];
  /** Todos los próximos pagos PENDING: el horizonte se decide en el cálculo puro. */
  pending: UpcomingCommitment[];
  /** `null` cuando la lectura secundaria falló: la pantalla lo dice, no lo oculta. */
  recent: RecentMovement[] | null;
  movementCount: number;
  incomeCents: bigint;
  expenseCents: bigint;
  monthlyBalanceCents: bigint;
}

/**
 * Lectura de /ahora. El patrimonio, las cuentas y los compromisos son datos
 * centrales: si fallan, la pantalla debe romper y mostrar su error boundary.
 * Los movimientos recientes son secundarios y degradan a `null` para que la
 * pantalla pueda decir qué no pudo cargar sin perder el saldo principal.
 */
export async function getNowData(): Promise<NowData> {
  const db = getDb();
  const today = todayInArgentina();
  const { start, end } = monthBounds(today.slice(0, 7));

  const [accounts, monthMovements, pending, movementCount, recent] = await Promise.all([
    getAccountsWithBalances(),
    db.transaction.findMany({
      where: { occurredOn: { gte: start, lt: end } },
      select: { type: true, amountCents: true, voidedAt: true },
    }),
    db.upcomingPayment.findMany({
      where: { status: "PENDING" },
      include: { plannedAccount: true },
      orderBy: { dueOn: "asc" },
    }),
    db.transaction.count({ where: { voidedAt: null } }),
    resilientRead(() =>
      db.transaction.findMany({
        include: { sourceAccount: true, destinationAccount: true, category: true, correction: true },
        orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }],
        take: 5,
      }),
    ),
  ]);

  const balanceByAccount = new Map(accounts.map((account) => [account.id, account.balanceCents]));
  const { incomeCents, expenseCents, balanceCents } = summarizeMonth(monthMovements);

  return {
    today,
    accounts: accounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      balanceCents: account.balanceCents,
      archived: account.status === "ARCHIVED",
    })),
    pending: pending.map((payment) => toCommitment(payment, balanceByAccount)),
    recent:
      recent?.map((movement) => ({
        id: movement.id,
        type: movement.type,
        description: movementLabel(movement),
        amountCents: movement.amountCents,
        occurredOn: dayString(movement.occurredOn),
        accountName: accountLabel(movement),
        voided: movement.voidedAt !== null,
        corrected: movement.correction !== null,
      })) ?? null,
    movementCount,
    incomeCents,
    expenseCents,
    monthlyBalanceCents: balanceCents,
  };
}

export interface MovementFilters {
  month: string;
  type?: "EXPENSE" | "INCOME" | "TRANSFER";
  accountId?: string;
  /** Filtro por categoría: lo usa cada causa de /cambios para mostrar su detalle. */
  categoryId?: string;
}

export async function getMovements(filters: MovementFilters) {
  const db = getDb();
  const { start, end } = monthBounds(filters.month);
  const accountFilter = filters.accountId
    ? { OR: [{ sourceAccountId: filters.accountId }, { destinationAccountId: filters.accountId }] }
    : {};
  const [movements, accounts] = await Promise.all([
    db.transaction.findMany({
      where: {
        occurredOn: { gte: start, lt: end },
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
        ...accountFilter,
      },
      include: { sourceAccount: true, destinationAccount: true, category: true },
      orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }],
    }),
    db.account.findMany({ orderBy: { name: "asc" } }),
  ]);
  return {
    accounts,
    movements: movements.map((movement) => ({
      id: movement.id,
      type: movement.type,
      amount: formatCents(movement.amountCents),
      occurredOn: movement.occurredOn.toISOString().slice(0, 10),
      description: movement.description || movement.category?.name || "Sin descripción",
      accountName:
        movement.type === "TRANSFER"
          ? `${movement.sourceAccount.name} → ${movement.destinationAccount?.name ?? ""}`
          : movement.sourceAccount.name,
      voided: movement.voidedAt !== null,
    })),
  };
}

export async function getInvestments() {
  const db = getDb();
  return db.investment.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ currentValueCents: "desc" }, { createdAt: "asc" }],
  });
}

export interface ConfirmedPayment {
  id: string;
  concept: string;
  dueOn: string;
  amountCents: bigint;
  accountName: string;
  transactionId: string | null;
}

export interface UpcomingData {
  today: string;
  accounts: { id: string; name: string; balanceCents: bigint; archived: boolean }[];
  pending: UpcomingCommitment[];
  /** Últimos pagos ya confirmados. No participan de compromiso ni proyección. */
  paid: ConfirmedPayment[];
  paidCount: number;
  hasActiveAccounts: boolean;
}

/** Lectura de /proximo: pendientes para la línea temporal y confirmados como historia. */
export async function getUpcomingData(): Promise<UpcomingData> {
  const db = getDb();
  const today = todayInArgentina();
  const [accounts, pending, paid, paidCount] = await Promise.all([
    getAccountsWithBalances(),
    db.upcomingPayment.findMany({
      where: { status: "PENDING" },
      include: { plannedAccount: true },
      orderBy: { dueOn: "asc" },
    }),
    db.upcomingPayment.findMany({
      where: { status: "PAID" },
      include: { plannedAccount: true },
      orderBy: [{ dueOn: "desc" }, { updatedAt: "desc" }],
      take: 5,
    }),
    db.upcomingPayment.count({ where: { status: "PAID" } }),
  ]);
  const balanceByAccount = new Map(accounts.map((account) => [account.id, account.balanceCents]));

  return {
    today,
    accounts: accounts.map((account) => ({
      id: account.id,
      name: account.name,
      balanceCents: account.balanceCents,
      archived: account.status === "ARCHIVED",
    })),
    pending: pending.map((payment) => toCommitment(payment, balanceByAccount)),
    paid: paid.map((payment) => ({
      id: payment.id,
      concept: payment.concept,
      dueOn: dayString(payment.dueOn),
      amountCents: payment.estimatedCents,
      accountName: payment.plannedAccount.name,
      transactionId: payment.transactionId,
    })),
    paidCount,
    hasActiveAccounts: accounts.some((account) => account.status === "ACTIVE"),
  };
}

// ---------------------------------------------------------------------------
// Data-access de superficies de análisis. Cada función lee datos reales del
// ledger y devuelve primitivas listas para el cálculo puro (analysis.ts).
// No contienen copy de UI.
// ---------------------------------------------------------------------------

const movementLabel = (input: {
  description: string | null;
  category: { name: string } | null;
  type: "EXPENSE" | "INCOME" | "TRANSFER";
}): string => {
  if (input.description) return input.description;
  if (input.category) return input.category.name;
  return input.type === "EXPENSE" ? "Gasto" : input.type === "INCOME" ? "Ingreso" : "Transferencia";
};

const accountLabel = (input: {
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  sourceAccount: { name: string };
  destinationAccount: { name: string } | null;
}): string =>
  input.type === "TRANSFER"
    ? `${input.sourceAccount.name} → ${input.destinationAccount?.name ?? ""}`
    : input.sourceAccount.name;

function dayString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function shiftDays(day: string, amount: number): Date {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date;
}

export interface ChangesData {
  /** Movimientos de la ventana observada **y** de la anterior, para comparar. */
  movements: CategorizedMovement[];
  period: Period;
  previous: Period;
  patrimonyCents: bigint;
  today: string;
  hasAccounts: boolean;
  /** Día del movimiento más antiguo registrado: define si el período anterior existe. */
  firstMovementDay: string | null;
  /** `null` cuando el desglose por causas no pudo leerse. */
  causesAvailable: boolean;
}

/**
 * Lectura de /cambios. Trae las dos ventanas de una sola vez: comparar exige el
 * período anterior completo, no solo el actual. El patrimonio y las cuentas son
 * datos centrales; el desglose por categorías es secundario y puede degradar
 * declarándolo, porque el cambio total sigue siendo verdadero sin él.
 */
export async function getChangesData(windowDays = 7): Promise<ChangesData> {
  const db = getDb();
  const today = todayInArgentina();
  const period = recentPeriod(today, windowDays);
  const previous = precedingPeriod(period);

  const [accounts, transactions, oldest] = await Promise.all([
    getAccountsWithBalances(),
    resilientRead(() =>
      db.transaction.findMany({
        where: {
          voidedAt: null,
          occurredOn: { gte: new Date(`${previous.start}T00:00:00.000Z`), lt: shiftDays(period.end, 1) },
        },
        include: { sourceAccount: true, destinationAccount: true, category: true },
        orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }],
      }),
    ),
    resilientRead(() =>
      db.transaction.findFirst({
        where: { voidedAt: null },
        orderBy: { occurredOn: "asc" },
        select: { occurredOn: true },
      }),
    ),
  ]);

  return {
    movements: (transactions ?? []).map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      amountCents: transaction.amountCents,
      occurredOn: dayString(transaction.occurredOn),
      voided: transaction.voidedAt !== null,
      label: movementLabel(transaction),
      accountName: accountLabel(transaction),
      categoryId: transaction.categoryId,
      categoryName: transaction.category?.name ?? null,
    })),
    period,
    previous,
    patrimonyCents: accounts.reduce((sum, account) => sum + account.balanceCents, 0n),
    today,
    hasAccounts: accounts.length > 0,
    firstMovementDay: oldest ? dayString(oldest.occurredOn) : null,
    causesAvailable: transactions !== null,
  };
}

export interface ProgressData {
  /** Movimientos de los dos tramos equivalentes, ya listos para comparar. */
  movements: AnalysisMovement[];
  current: Period;
  previous: Period;
  /** `false` cuando el mes anterior es más corto y el tramo se tuvo que acotar. */
  equivalent: boolean;
  today: string;
  hasAccounts: boolean;
  patrimonyCents: bigint;
  /** Base de la cobertura: cuentas activas, igual que /ahora. */
  baseCents: bigint;
  committedCents: bigint;
  overdueCount: number;
  /** `false` cuando los compromisos no pudieron leerse: la cobertura se omite. */
  commitmentsAvailable: boolean;
}

/**
 * Lectura de /progreso. Compara tramos equivalentes —días 1 a hoy contra los
 * mismos días del mes anterior— porque un mes parcial contra un mes completo no
 * es una comparación. La cobertura usa la misma definición que /ahora: cuentas
 * activas contra los compromisos del horizonte, para que las dos pantallas no
 * digan números distintos de lo mismo.
 */
export async function getProgressData(): Promise<ProgressData> {
  const db = getDb();
  const today = todayInArgentina();
  const { current, previous, equivalent } = equivalentMonthPeriods(today);

  const [accounts, rows, pending] = await Promise.all([
    getAccountsWithBalances(),
    db.transaction.findMany({
      where: {
        voidedAt: null,
        occurredOn: {
          gte: new Date(`${previous.start}T00:00:00.000Z`),
          lt: shiftDays(current.end, 1),
        },
      },
      select: { id: true, type: true, amountCents: true, occurredOn: true },
    }),
    resilientRead(() =>
      db.upcomingPayment.findMany({
        where: { status: "PENDING" },
        include: { plannedAccount: true },
        orderBy: { dueOn: "asc" },
      }),
    ),
  ]);

  const balanceByAccount = new Map(accounts.map((account) => [account.id, account.balanceCents]));
  const commitments = (pending ?? []).map((payment) => toCommitment(payment, balanceByAccount));
  const selection = selectCommitments(commitments, today);
  const projectionAccounts = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    balanceCents: account.balanceCents,
    archived: account.status === "ARCHIVED",
  }));

  return {
    movements: rows.map((row) => ({
      id: row.id,
      type: row.type,
      amountCents: row.amountCents,
      occurredOn: dayString(row.occurredOn),
      voided: false,
      label: "",
      accountName: "",
    })),
    current,
    previous,
    equivalent,
    today,
    hasAccounts: accounts.length > 0,
    patrimonyCents: accounts.reduce((sum, account) => sum + account.balanceCents, 0n),
    baseCents: accountsMoneyCents(projectionAccounts),
    committedCents: selection.committedCents,
    overdueCount: selection.overdue.length,
    commitmentsAvailable: pending !== null,
  };
}

export async function getRealityData(): Promise<{
  accounts: { id: string; name: string; type: string; balanceCents: bigint; archived: boolean }[];
  investments: { id: string; name: string; currentValueCents: bigint }[];
  committedCents: bigint;
  upcomingCount: number;
  hasMovements: boolean;
  hasIncome: boolean;
}> {
  const db = getDb();
  const [accounts, investments, pending, movementCount, incomeCount] = await Promise.all([
    getAccountsWithBalances(),
    // Inversiones es un dominio secundario: si su lectura falla transitoriamente,
    // /mi-realidad degrada mostrando 0 inversiones en vez de romper toda la vista
    // (misma resiliencia que el dashboard de /ahora).
    resilientList(() => getInvestments()),
    db.upcomingPayment.findMany({ where: { status: "PENDING" }, select: { estimatedCents: true } }),
    db.transaction.count({ where: { voidedAt: null } }),
    db.transaction.count({ where: { voidedAt: null, type: "INCOME" } }),
  ]);

  return {
    accounts: accounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      balanceCents: account.balanceCents,
      archived: account.status === "ARCHIVED",
    })),
    investments: investments.map((investment) => ({
      id: investment.id,
      name: investment.name,
      currentValueCents: investment.currentValueCents,
    })),
    committedCents: pending.reduce((sum, payment) => sum + payment.estimatedCents, 0n),
    upcomingCount: pending.length,
    hasMovements: movementCount > 0,
    hasIncome: incomeCount > 0,
  };
}

export async function getActData(): Promise<{
  today: string;
  hasAccounts: boolean;
  movementCount: number;
  patrimonyCents: bigint;
  pendingPayments: {
    id: string;
    concept: string;
    dueOn: string;
    estimatedCents: bigint;
    accountName: string;
    accountBalanceCents: bigint;
  }[];
}> {
  const db = getDb();
  const today = todayInArgentina();
  const [accounts, pending, movementCount] = await Promise.all([
    getAccountsWithBalances(),
    db.upcomingPayment.findMany({
      where: { status: "PENDING" },
      include: { plannedAccount: true },
      orderBy: { dueOn: "asc" },
    }),
    db.transaction.count({ where: { voidedAt: null } }),
  ]);

  const balanceByAccount = new Map(accounts.map((account) => [account.id, account.balanceCents]));
  const activeAccounts = accounts.filter((account) => account.status === "ACTIVE");

  return {
    today,
    hasAccounts: activeAccounts.length > 0,
    movementCount,
    patrimonyCents: accounts.reduce((sum, account) => sum + account.balanceCents, 0n),
    pendingPayments: pending.map((payment) => ({
      id: payment.id,
      concept: payment.concept,
      dueOn: dayString(payment.dueOn),
      estimatedCents: payment.estimatedCents,
      accountName: payment.plannedAccount.name,
      accountBalanceCents: balanceByAccount.get(payment.plannedAccountId) ?? 0n,
    })),
  };
}
