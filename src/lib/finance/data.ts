import "server-only";
import { getDb } from "../db";
import { formatCents, monthBounds, summarizeMonth, todayInArgentina } from "./domain";

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

export async function getDashboardData() {
  const db = getDb();
  const today = todayInArgentina();
  const month = today.slice(0, 7);
  const { start, end } = monthBounds(month);
  const historyStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - 5, 1));
  const inSevenDays = new Date(`${today}T00:00:00.000Z`);
  inSevenDays.setUTCDate(inSevenDays.getUTCDate() + 7);

  const [accounts, monthMovements, historyMovements, upcoming, recent] = await Promise.all([
    getAccountsWithBalances(),
    db.transaction.findMany({
      where: { occurredOn: { gte: start, lt: end } },
      select: { type: true, amountCents: true, voidedAt: true },
    }),
    db.transaction.findMany({
      where: { occurredOn: { gte: historyStart, lt: end } },
      select: { type: true, amountCents: true, occurredOn: true, voidedAt: true },
      orderBy: { occurredOn: "asc" },
    }),
    db.upcomingPayment.findMany({
      where: { status: "PENDING", dueOn: { lte: inSevenDays } },
      include: { plannedAccount: true },
      orderBy: { dueOn: "asc" },
      take: 5,
    }),
    db.transaction.findMany({
      include: { sourceAccount: true, destinationAccount: true, category: true },
      orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }],
      take: 5,
    }),
  ]);

  const { incomeCents, expenseCents, balanceCents } = summarizeMonth(monthMovements);
  const totalCents = accounts.reduce((sum, account) => sum + account.balanceCents, 0n);
  const upcomingCents = upcoming.reduce((sum, payment) => sum + payment.estimatedCents, 0n);
  const monthLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const monthlyHistory = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - (5 - index), 1));
    const key = date.toISOString().slice(0, 7);
    const movements = historyMovements.filter((movement) => movement.occurredOn.toISOString().slice(0, 7) === key);
    const totals = summarizeMonth(movements);
    return {
      month: key,
      label: monthLabels[date.getUTCMonth()] ?? key.slice(5),
      incomeCents: totals.incomeCents,
      expenseCents: totals.expenseCents,
    };
  });

  return {
    accounts,
    totalCents,
    incomeCents,
    expenseCents,
    monthlyBalanceCents: balanceCents,
    monthlyHistory,
    upcomingCents,
    upcoming: upcoming.map((payment) => ({
      id: payment.id,
      concept: payment.concept,
      amount: formatCents(payment.estimatedCents),
      dueOn: payment.dueOn.toISOString().slice(0, 10),
      accountName: payment.plannedAccount.name,
    })),
    recent: recent.map((movement) => ({
      id: movement.id,
      type: movement.type,
      description: movement.description || movement.category?.name || movement.type,
      amount: formatCents(movement.amountCents),
      occurredOn: movement.occurredOn.toISOString().slice(0, 10),
      accountName:
        movement.type === "TRANSFER"
          ? `${movement.sourceAccount.name} → ${movement.destinationAccount?.name ?? ""}`
          : movement.sourceAccount.name,
      voided: movement.voidedAt !== null,
    })),
    today,
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

export async function getUpcomingPayments() {
  const db = getDb();
  const [payments, accounts] = await Promise.all([
    db.upcomingPayment.findMany({
      include: { plannedAccount: true },
      orderBy: [{ status: "asc" }, { dueOn: "asc" }],
    }),
    db.account.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
  ]);
  return { payments, accounts };
}
