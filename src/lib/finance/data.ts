import "server-only";
import { getDb } from "../db";
import { formatCents, monthBounds, summarizeMonth, todayInArgentina } from "./domain";
import { resilientList, resilientRead, type AnalysisMovement } from "./analysis";
import type { UpcomingCommitment } from "./projection";

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

export async function getChangesData(): Promise<{
  movements: AnalysisMovement[];
  currentPatrimonyCents: bigint;
  today: string;
  windowStart: string;
  windowDays: number;
  hasAccounts: boolean;
}> {
  const db = getDb();
  const today = todayInArgentina();
  const windowDays = 7;
  const start = shiftDays(today, -(windowDays - 1));
  const end = shiftDays(today, 1);

  const [transactions, accounts] = await Promise.all([
    db.transaction.findMany({
      where: { voidedAt: null, occurredOn: { gte: start, lt: end } },
      include: { sourceAccount: true, destinationAccount: true, category: true },
      orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }],
    }),
    getAccountsWithBalances(),
  ]);

  const currentPatrimonyCents = accounts.reduce((sum, account) => sum + account.balanceCents, 0n);

  return {
    movements: transactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      amountCents: transaction.amountCents,
      occurredOn: dayString(transaction.occurredOn),
      voided: transaction.voidedAt !== null,
      label: movementLabel(transaction),
      accountName: accountLabel(transaction),
    })),
    currentPatrimonyCents,
    today,
    windowStart: dayString(start),
    windowDays,
    hasAccounts: accounts.length > 0,
  };
}

export async function getProgressData(): Promise<{
  currentMonthMovements: AnalysisMovement[];
  previousMonthMovements: AnalysisMovement[];
  hasPreviousPeriod: boolean;
  availableCents: bigint;
  upcomingCents: bigint;
  daysWithActivity: number;
  elapsedDays: number;
  currentMonth: string;
  previousMonth: string;
  hasAccounts: boolean;
}> {
  const db = getDb();
  const today = todayInArgentina();
  const currentMonth = today.slice(0, 7);
  const currentBounds = monthBounds(currentMonth);
  const previousMonth = dayString(
    new Date(Date.UTC(currentBounds.start.getUTCFullYear(), currentBounds.start.getUTCMonth() - 1, 1)),
  ).slice(0, 7);
  const previousBounds = monthBounds(previousMonth);

  const [currentRows, previousRows, accounts, upcoming] = await Promise.all([
    db.transaction.findMany({
      where: { voidedAt: null, occurredOn: { gte: currentBounds.start, lt: currentBounds.end } },
      select: { id: true, type: true, amountCents: true, occurredOn: true },
    }),
    db.transaction.findMany({
      where: { voidedAt: null, occurredOn: { gte: previousBounds.start, lt: previousBounds.end } },
      select: { id: true, type: true, amountCents: true, occurredOn: true },
    }),
    getAccountsWithBalances(),
    db.upcomingPayment.findMany({ where: { status: "PENDING" }, select: { estimatedCents: true } }),
  ]);

  const toMovement = (row: {
    id: string;
    type: "EXPENSE" | "INCOME" | "TRANSFER";
    amountCents: bigint;
    occurredOn: Date;
  }): AnalysisMovement => ({
    id: row.id,
    type: row.type,
    amountCents: row.amountCents,
    occurredOn: dayString(row.occurredOn),
    voided: false,
    label: "",
    accountName: "",
  });

  const daysWithActivity = new Set(currentRows.map((row) => dayString(row.occurredOn))).size;

  return {
    currentMonthMovements: currentRows.map(toMovement),
    previousMonthMovements: previousRows.map(toMovement),
    hasPreviousPeriod: previousRows.length > 0,
    availableCents: accounts.reduce((sum, account) => sum + account.balanceCents, 0n),
    upcomingCents: upcoming.reduce((sum, payment) => sum + payment.estimatedCents, 0n),
    daysWithActivity,
    elapsedDays: Number(today.slice(8, 10)),
    currentMonth,
    previousMonth,
    hasAccounts: accounts.length > 0,
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
