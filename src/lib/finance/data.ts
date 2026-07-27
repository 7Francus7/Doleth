import "server-only";
import { getDb } from "../db";
import { formatCents, monthBounds, summarizeMonth, todayInArgentina } from "./domain";

/**
 * Capa de lectura financiera.
 *
 * Todas las funciones exigen `userId` como primer argumento y lo aplican al
 * `where` de cada consulta. El identificador viene siempre de la sesión validada
 * (`requireUser()`); nunca de la URL ni del formulario. No existe en este archivo
 * ninguna consulta sin filtro de propietario: esa es la invariante que sostiene el
 * aislamiento entre usuarios.
 */

export async function getAccountsWithBalances(userId: string) {
  const db = getDb();
  const [accounts, totals] = await Promise.all([
    db.account.findMany({ where: { userId }, orderBy: [{ status: "asc" }, { createdAt: "asc" }] }),
    db.ledgerEntry.groupBy({
      by: ["accountId"],
      where: { userId, transaction: { voidedAt: null } },
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

export async function getMovementFormData(userId: string) {
  const db = getDb();
  const [accounts, categories] = await Promise.all([
    db.account.findMany({ where: { userId, status: "ACTIVE" }, orderBy: { name: "asc" } }),
    db.category.findMany({ where: { userId }, orderBy: [{ kind: "asc" }, { name: "asc" }] }),
  ]);
  return {
    accounts: accounts.map(({ id, name, currency }) => ({ id, name, currency })),
    categories: categories.map(({ id, name, kind }) => ({ id, name, kind })),
    today: todayInArgentina(),
  };
}

export async function getDashboardData(userId: string) {
  const db = getDb();
  const today = todayInArgentina();
  const month = today.slice(0, 7);
  const { start, end } = monthBounds(month);
  const historyStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - 5, 1));
  const inSevenDays = new Date(`${today}T00:00:00.000Z`);
  inSevenDays.setUTCDate(inSevenDays.getUTCDate() + 7);

  const [accounts, monthMovements, historyMovements, upcoming, recent] = await Promise.all([
    getAccountsWithBalances(userId),
    db.transaction.findMany({
      where: { userId, occurredOn: { gte: start, lt: end } },
      select: { type: true, amountCents: true, voidedAt: true },
    }),
    db.transaction.findMany({
      where: { userId, occurredOn: { gte: historyStart, lt: end } },
      select: { type: true, amountCents: true, occurredOn: true, voidedAt: true },
      orderBy: { occurredOn: "asc" },
    }),
    db.upcomingPayment.findMany({
      where: { userId, status: "PENDING", dueOn: { lte: inSevenDays } },
      include: { plannedAccount: true },
      orderBy: { dueOn: "asc" },
      take: 5,
    }),
    db.transaction.findMany({
      where: { userId },
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

export async function getMovements(userId: string, filters: MovementFilters) {
  const db = getDb();
  const { start, end } = monthBounds(filters.month);
  // El accountId llega de la query string: se usa sólo para acotar dentro de lo
  // que ya es del usuario, nunca para ampliar el alcance.
  const accountFilter = filters.accountId
    ? { OR: [{ sourceAccountId: filters.accountId }, { destinationAccountId: filters.accountId }] }
    : {};
  const [movements, accounts] = await Promise.all([
    db.transaction.findMany({
      where: {
        userId,
        occurredOn: { gte: start, lt: end },
        ...(filters.type ? { type: filters.type } : {}),
        ...accountFilter,
      },
      include: { sourceAccount: true, destinationAccount: true, category: true },
      orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }],
    }),
    db.account.findMany({ where: { userId }, orderBy: { name: "asc" } }),
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

/** Movimiento por id, acotado al propietario: cambiar el id de la URL no alcanza. */
export async function getOwnedMovement(userId: string, id: string) {
  return getDb().transaction.findFirst({
    where: { id, userId },
    include: { sourceAccount: true, destinationAccount: true, category: true, correction: true, correctedFrom: true },
  });
}

export async function getOwnedUpcomingPayment(userId: string, id: string) {
  return getDb().upcomingPayment.findFirst({
    where: { id, userId },
    include: { plannedAccount: true, transaction: true },
  });
}

export async function getInvestments(userId: string) {
  return getDb().investment.findMany({
    where: { userId, status: "ACTIVE" },
    orderBy: [{ currentValueCents: "desc" }, { createdAt: "asc" }],
  });
}

export async function getUpcomingPayments(userId: string) {
  const db = getDb();
  const [payments, accounts] = await Promise.all([
    db.upcomingPayment.findMany({
      where: { userId },
      include: { plannedAccount: true },
      orderBy: [{ status: "asc" }, { dueOn: "asc" }],
    }),
    db.account.findMany({ where: { userId, status: "ACTIVE" }, orderBy: { name: "asc" } }),
  ]);
  return { payments, accounts };
}
