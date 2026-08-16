import "server-only";
import { getDb } from "../db";
import { formatCents, monthBounds, summarizeMonth, todayInArgentina } from "./domain";
import { getDisplayContextFromBook, valueAmounts, type DisplayContext } from "./display";
import { valuePortfolio, type Holding } from "./holdings";
import { isSupportedCurrency } from "./currency";
import { loadLatestPrices } from "./rates/prices";
import { isLiabilityAccount } from "./accountKind";
import type { CategoryCatalogEntry } from "./categoryRules";
import { resolveRateBook, type ResolvedRateBook } from "./rates/store";
import { resilientRead, type AnalysisMovement } from "./analysis";
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
import type { RealityAccount, RealityInvestment, RealityMovement } from "./reality";
import type { SpendingMovement } from "./spending";
import { logServerError } from "../observability";
import {
  monthPeriod,
  previousMonth,
  resolvePeriod,
  type CloseAccount,
  type ClosePayment,
  type ClosePeriod,
} from "./close";

const reportSecondaryRead = (route: string, operation: string) => () => {
  logServerError({ route, operation, code: "secondary-read-failed" });
};

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
    // Derivado del tipo, nunca guardado: una columna aparte podría afirmar que
    // una tarjeta no es un pasivo, y eso no significa nada.
    liability: isLiabilityAccount(account.type),
    initialBalanceCents: account.initialBalanceCents,
    balanceCents: account.initialBalanceCents + (totalsByAccount.get(account.id) ?? 0n),
  }));
}

/**
 * Cuentas con su saldo ya expresado en la moneda de lectura de la persona.
 *
 * Es el único lugar donde las pantallas deberían tomar saldos: convierte una
 * vez, al entrar, y entrega junto con los números el contexto que dice con qué
 * cotización se hizo y qué quedó afuera. La capa de cálculo que viene después
 * sigue trabajando en una sola moneda y no se entera de que existe otra.
 *
 * `originalCents` y `currency` viajan igual, porque el saldo de una cuenta en
 * dólares se tiene que poder seguir leyendo en dólares: convertirlo para el
 * total no puede significar perderlo de vista en su propia moneda.
 */
export async function getValuedAccounts(userId: string, now = new Date()) {
  const [accounts, book] = await Promise.all([getAccountsWithBalances(userId), resolveRateBook(userId, now)]);
  const { valued, context } = valueAmounts(accounts, book, now);

  return {
    book,
    context,
    accounts: accounts.map((account, index) => ({
      ...account,
      originalCents: account.balanceCents,
      balanceCents: valued[index] ?? 0n,
    })),
  };
}

/**
 * Convierte importes de movimientos a la moneda de lectura.
 *
 * Un movimiento guarda su importe en la moneda de la cuenta de la que salió, así
 * que sumar gastos de un mes sin convertir daría un número sin significado. Los
 * huecos de conversión de esta lista no se declaran aparte: la pantalla ya
 * declara los de sus saldos, que provienen de las mismas cuentas y de la misma
 * cotización faltante.
 */
function valueMovementAmounts<T extends { amountCents: bigint; currency: string }>(
  movements: readonly T[],
  book: ResolvedRateBook,
  now: Date,
): T[] {
  const { valued } = valueAmounts(
    movements.map((movement) => ({ balanceCents: movement.amountCents, currency: movement.currency })),
    book,
    now,
  );
  return movements.map((movement, index) => ({ ...movement, amountCents: valued[index] ?? 0n }));
}

/**
 * Categorías que un formulario puede ofrecer.
 *
 * Las archivadas quedan afuera: archivar existe justamente para dejar de verlas
 * al cargar. La excepción es `keepId`, la categoría que el movimiento que se está
 * corrigiendo ya tenía. Sin esa excepción, corregir el importe de un gasto viejo
 * cambiaría también su categoría en silencio, porque el selector no tendría la
 * opción que estaba elegida.
 */
export async function loadSelectableCategories(userId: string, keepId?: string | null) {
  const db = getDb();
  return db.category.findMany({
    where: {
      userId,
      ...(keepId ? { OR: [{ archivedAt: null }, { id: keepId }] } : { archivedAt: null }),
    },
    orderBy: [{ kind: "asc" }, { name: "asc" }],
  });
}

export async function getMovementFormData(userId: string, keepCategoryId?: string | null) {
  const db = getDb();
  const [accounts, categories] = await Promise.all([
    db.account.findMany({ where: { userId, status: "ACTIVE" }, orderBy: { name: "asc" } }),
    loadSelectableCategories(userId, keepCategoryId),
  ]);
  return {
    accounts: accounts.map(({ id, name, currency }) => ({ id, name, currency })),
    categories: categories.map(({ id, name, kind }) => ({ id, name, kind })),
    today: todayInArgentina(),
  };
}

/**
 * El catálogo completo de una persona, con lo que cada categoría carga encima.
 *
 * El uso viaja con la categoría porque es lo que hace archivable la decisión:
 * archivar una con cuarenta movimientos y archivar una vacía se parecen en la
 * pantalla y no se parecen en nada en la cabeza de quien aprieta el botón.
 */
export async function getCategoryCatalog(userId: string): Promise<CategoryCatalogEntry[]> {
  const db = getDb();
  const [categories, movementUse, upcomingUse] = await Promise.all([
    db.category.findMany({ where: { userId }, orderBy: [{ kind: "asc" }, { name: "asc" }] }),
    db.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, voidedAt: null, categoryId: { not: null } },
      _count: { _all: true },
    }),
    db.upcomingPayment.groupBy({
      by: ["categoryId"],
      where: { userId, status: "PENDING", categoryId: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const movements = new Map(movementUse.map((row) => [row.categoryId, row._count._all]));
  const upcoming = new Map(upcomingUse.map((row) => [row.categoryId, row._count._all]));

  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    kind: category.kind,
    archived: category.archivedAt !== null,
    movementCount: movements.get(category.id) ?? 0,
    upcomingCount: upcoming.get(category.id) ?? 0,
  }));
}

/**
 * Panel resumido con seis meses de historia. Lo consumen las pruebas de
 * aislamiento como sonda de propiedad; `getNowData` es la lectura que usa la
 * pantalla /ahora.
 */
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

export interface RecentMovement {
  id: string;
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  description: string;
  amountCents: bigint;
  /**
   * Moneda del movimiento, sin convertir.
   *
   * Una fila de evidencia se lee en la moneda en que ocurrió: un gasto de
   * US$ 50 es US$ 50, no su equivalente aproximado en pesos a la cotización de
   * hoy. Convertir cada fila haría que el historial cambiara de números cada vez
   * que se mueve el dólar, y un historial que cambia solo deja de ser evidencia.
   * El que se convierte es el total, que es el que tiene que ser comparable.
   */
  currency: string;
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
    /** Saldo ya convertido a la moneda de lectura: es el que suma al total. */
    balanceCents: bigint;
    /** Saldo en la moneda propia de la cuenta, sin convertir. */
    originalCents: bigint;
    currency: string;
    archived: boolean;
    /** El saldo es una deuda, no dinero disponible. */
    liability: boolean;
  }[];
  /** Todos los próximos pagos PENDING: el horizonte se decide en el cálculo puro. */
  pending: UpcomingCommitment[];
  /** `null` cuando la lectura secundaria falló: la pantalla lo dice, no lo oculta. */
  recent: RecentMovement[] | null;
  movementCount: number;
  incomeCents: bigint;
  expenseCents: bigint;
  monthlyBalanceCents: bigint;
  /**
   * En qué moneda están los importes de arriba, con qué cotización se llegó a
   * ellos y qué quedó sin convertir. La pantalla no puede mostrar el total sin
   * mirar esto: `complete` es lo que autoriza a presentarlo como total.
   */
  display: DisplayContext;
  /**
   * Cotizaciones resueltas para esta persona. Viaja para que la vista pueda
   * expresar un total en la otra moneda sin volver a consultar la base ni
   * arriesgarse a usar una cotización distinta de la que produjo los números.
   */
  book: ResolvedRateBook;
}

/**
 * Lectura de /ahora. El patrimonio, las cuentas y los compromisos son datos
 * centrales: si fallan, la pantalla debe romper y mostrar su error boundary.
 * Los movimientos recientes son secundarios y degradan a `null` para que la
 * pantalla pueda decir qué no pudo cargar sin perder el saldo principal.
 */
export async function getNowData(userId: string, now = new Date()): Promise<NowData> {
  const db = getDb();
  const today = todayInArgentina(now);
  const { start, end } = monthBounds(today.slice(0, 7));

  const [valuedAccounts, monthMovements, pending, movementCount, recent] = await Promise.all([
    getValuedAccounts(userId, now),
    db.transaction.findMany({
      where: { userId, occurredOn: { gte: start, lt: end } },
      select: { type: true, amountCents: true, currency: true, voidedAt: true },
    }),
    db.upcomingPayment.findMany({
      where: { userId, status: "PENDING" },
      include: { plannedAccount: true },
      orderBy: { dueOn: "asc" },
    }),
    db.transaction.count({ where: { userId, voidedAt: null } }),
    resilientRead(() =>
      db.transaction.findMany({
        where: { userId },
        include: { sourceAccount: true, destinationAccount: true, category: true, correction: true },
        orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }],
        take: 5,
      }),
      reportSecondaryRead("/ahora", "recent-movements"),
    ),
  ]);

  const { accounts, book, context } = valuedAccounts;
  const balanceByAccount = new Map(accounts.map((account) => [account.id, account.balanceCents]));
  const { incomeCents, expenseCents, balanceCents } = summarizeMonth(
    valueMovementAmounts(monthMovements, book, now),
  );

  return {
    display: context,
    book,
    today,
    accounts: accounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      balanceCents: account.balanceCents,
      originalCents: account.originalCents,
      currency: account.currency,
      archived: account.status === "ARCHIVED",
      liability: account.liability,
    })),
    pending: pending.map((payment) => toCommitment(payment, balanceByAccount)),
    recent:
      recent?.map((movement) => ({
        id: movement.id,
        type: movement.type,
        description: movementLabel(movement),
        amountCents: movement.amountCents,
        currency: movement.currency,
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
        ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
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
    include: { plannedAccount: true, transaction: true, category: true },
  });
}

export async function getInvestments(userId: string) {
  return getDb().investment.findMany({
    where: { userId, status: "ACTIVE" },
    orderBy: [{ currentValueCents: "desc" }, { createdAt: "asc" }],
  });
}

/**
 * Cartera valuada: cada tenencia con su precio, si lo tiene.
 *
 * El valor de una tenencia con cantidad sale de multiplicarla por el último
 * precio conocido; el de una sin cantidad, del valor declarado. La distinción
 * viaja en `mode` para que la pantalla pueda decir cuál de las dos está mirando:
 * un número que se actualiza solo y uno que alguien escribió hace tres meses no
 * merecen la misma confianza, y presentarlos igual sería mentir por omisión.
 */
export async function getPortfolio(userId: string, now = new Date()) {
  const investments = await getInvestments(userId);
  const symbols = investments.map((item) => item.symbol).filter((symbol): symbol is string => Boolean(symbol));
  const [prices, book] = await Promise.all([loadLatestPrices(symbols), resolveRateBook(userId, now)]);

  const holdings: Holding[] = investments.map((item) => ({
    id: item.id,
    name: item.name,
    kind: item.kind,
    // Una moneda que el producto no sabe leer no puede valuarse: se trata como
    // pesos para no romper la pantalla, y la valuación general ya declara el
    // hueco por su lado.
    currency: isSupportedCurrency(item.currency) ? item.currency : "ARS",
    investedCents: item.investedCents,
    quantityMicros: item.quantityMicros,
    symbol: item.symbol,
    declaredValueCents: item.currentValueCents,
  }));

  return { portfolio: valuePortfolio(holdings, prices), book, display: getDisplayContextFromBook(book, now) };
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
  accounts: { id: string; name: string; balanceCents: bigint; archived: boolean; liability: boolean }[];
  pending: UpcomingCommitment[];
  /** Últimos pagos ya confirmados. No participan de compromiso ni proyección. */
  paid: ConfirmedPayment[];
  paidCount: number;
  hasActiveAccounts: boolean;
}

/** Lectura de /proximo: pendientes para la línea temporal y confirmados como historia. */
export async function getUpcomingData(userId: string): Promise<UpcomingData> {
  const db = getDb();
  const today = todayInArgentina();
  const [accounts, pending, paid, paidCount] = await Promise.all([
    getAccountsWithBalances(userId),
    db.upcomingPayment.findMany({
      where: { userId, status: "PENDING" },
      include: { plannedAccount: true },
      orderBy: { dueOn: "asc" },
    }),
    db.upcomingPayment.findMany({
      where: { userId, status: "PAID" },
      include: { plannedAccount: true },
      orderBy: [{ dueOn: "desc" }, { updatedAt: "desc" }],
      take: 5,
    }),
    db.upcomingPayment.count({ where: { userId, status: "PAID" } }),
  ]);
  const balanceByAccount = new Map(accounts.map((account) => [account.id, account.balanceCents]));

  return {
    today,
    accounts: accounts.map((account) => ({
      id: account.id,
      name: account.name,
      balanceCents: account.balanceCents,
      archived: account.status === "ARCHIVED",
      liability: account.liability,
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

/** Mes civil en curso: /mi-realidad describe la actividad del mes, no de 7 días. */
function monthPeriodDays(today: string): Period {
  return monthPeriod(today.slice(0, 7), today);
}

/**
 * Traduce una transacción de Prisma al movimiento puro que consumen `reality.ts`
 * y `close.ts`. `corrected` marca el original de una corrección: sigue en el
 * historial y ya está anulado, así que no vuelve a pesar.
 */
function toRealityMovement(transaction: {
  id: string;
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  amountCents: bigint;
  occurredOn: Date;
  voidedAt: Date | null;
  description: string | null;
  category: { name: string } | null;
  sourceAccount: { name: string };
  destinationAccount: { name: string } | null;
  correction: { id: string } | null;
}): RealityMovement {
  return {
    id: transaction.id,
    type: transaction.type,
    amountCents: transaction.amountCents,
    occurredOn: dayString(transaction.occurredOn),
    voided: transaction.voidedAt !== null,
    label: movementLabel(transaction),
    accountName: accountLabel(transaction),
    corrected: transaction.correction !== null,
  };
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
export async function getChangesData(userId: string, windowDays = 7): Promise<ChangesData> {
  const db = getDb();
  const today = todayInArgentina();
  const period = recentPeriod(today, windowDays);
  const previous = precedingPeriod(period);

  const [accounts, transactions, oldest] = await Promise.all([
    getAccountsWithBalances(userId),
    resilientRead(() =>
      db.transaction.findMany({
        where: {
          userId,
          voidedAt: null,
          occurredOn: { gte: new Date(`${previous.start}T00:00:00.000Z`), lt: shiftDays(period.end, 1) },
        },
        include: { sourceAccount: true, destinationAccount: true, category: true },
        orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }],
      }),
      reportSecondaryRead("/cambios", "comparison-movements"),
    ),
    resilientRead(() =>
      db.transaction.findFirst({
        where: { userId, voidedAt: null },
        orderBy: { occurredOn: "asc" },
        select: { occurredOn: true },
      }),
      reportSecondaryRead("/cambios", "oldest-movement"),
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
export async function getProgressData(userId: string): Promise<ProgressData> {
  const db = getDb();
  const today = todayInArgentina();
  const { current, previous, equivalent } = equivalentMonthPeriods(today);

  const [accounts, rows, pending] = await Promise.all([
    getAccountsWithBalances(userId),
    db.transaction.findMany({
      where: {
        userId,
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
        where: { userId, status: "PENDING" },
        include: { plannedAccount: true },
        orderBy: { dueOn: "asc" },
      }),
      reportSecondaryRead("/progreso", "upcoming-payments"),
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
    liability: account.liability,
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

/**
 * Actividad por cuenta derivada del ledger: último día con movimiento no anulado
 * y cuántos movimientos la tocaron. Sirve para decir "sin actividad registrada"
 * con evidencia, en vez de afirmar que una cuenta está desactualizada sin regla.
 */
async function getAccountActivity(userId: string): Promise<
  Map<string, { lastActivityOn: string | null; movementCount: number }>
> {
  const db = getDb();
  const entries = await db.ledgerEntry.findMany({
    where: { userId, transaction: { voidedAt: null } },
    select: { accountId: true, transaction: { select: { occurredOn: true } } },
  });

  const activity = new Map<string, { lastActivityOn: string | null; movementCount: number }>();
  for (const entry of entries) {
    const day = dayString(entry.transaction.occurredOn);
    const current = activity.get(entry.accountId) ?? { lastActivityOn: null, movementCount: 0 };
    activity.set(entry.accountId, {
      lastActivityOn:
        current.lastActivityOn === null || day > current.lastActivityOn ? day : current.lastActivityOn,
      movementCount: current.movementCount + 1,
    });
  }
  return activity;
}

export interface RealityData {
  today: string;
  period: Period;
  accounts: RealityAccount[];
  /** `null` cuando la lectura falló: no es lo mismo que "no hay inversiones". */
  investments: RealityInvestment[] | null;
  /** `null` cuando la lectura falló. */
  commitments: UpcomingCommitment[] | null;
  movements: RealityMovement[];
}

/**
 * Lectura de /mi-realidad. Las cuentas y sus saldos son datos centrales: si
 * fallan, la pantalla rompe y muestra su error boundary, porque sin base no hay
 * composición que contar. Las inversiones y los compromisos son dominios
 * secundarios: degradan a `null` para que la pantalla diga qué no pudo leer en
 * vez de mostrar un cero que se leería como "no tenés".
 */
export async function getRealityData(userId: string): Promise<RealityData> {
  const db = getDb();
  const today = todayInArgentina();
  const period = monthPeriodDays(today);

  const [accounts, activity, investments, pending, movements] = await Promise.all([
    getAccountsWithBalances(userId),
    getAccountActivity(userId),
    resilientRead(
      () => getInvestments(userId),
      reportSecondaryRead("/mi-realidad", "investments"),
    ),
    resilientRead(() =>
      db.upcomingPayment.findMany({
        where: { userId, status: "PENDING" },
        include: { plannedAccount: true },
        orderBy: { dueOn: "asc" },
      }),
      reportSecondaryRead("/mi-realidad", "upcoming-payments"),
    ),
    db.transaction.findMany({
      where: {
        userId,
        occurredOn: {
          gte: new Date(`${period.start}T00:00:00.000Z`),
          lt: shiftDays(period.end, 1),
        },
      },
      include: { sourceAccount: true, destinationAccount: true, category: true, correction: true },
      orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  const balanceByAccount = new Map(accounts.map((account) => [account.id, account.balanceCents]));

  return {
    today,
    period,
    accounts: accounts.map((account) => {
      const stats = activity.get(account.id) ?? { lastActivityOn: null, movementCount: 0 };
      return {
        id: account.id,
        name: account.name,
        type: account.type,
        balanceCents: account.balanceCents,
        initialBalanceCents: account.initialBalanceCents,
        archived: account.status === "ARCHIVED",
        lastActivityOn: stats.lastActivityOn,
        movementCount: stats.movementCount,
      };
    }),
    investments:
      investments?.map((investment) => ({
        id: investment.id,
        name: investment.name,
        currentValueCents: investment.currentValueCents,
      })) ?? null,
    commitments: pending?.map((payment) => toCommitment(payment, balanceByAccount)) ?? null,
    movements: movements.map(toRealityMovement),
  };
}

// ---------------------------------------------------------------------------
// Revisión mensual (/mi-realidad/cierre). Solo lee: no escribe nada.
// ---------------------------------------------------------------------------

export interface CloseData {
  today: string;
  period: ClosePeriod;
  patrimonyNowCents: bigint;
  accounts: CloseAccount[];
  movements: RealityMovement[];
  payments: ClosePayment[];
  paymentsAvailable: boolean;
}

/**
 * Lectura de la revisión mensual. Trae los movimientos del período **y** los
 * posteriores: sin los posteriores no se puede saber con qué terminó el mes,
 * porque el saldo de hoy ya los tiene adentro. Los asientos se agrupan por
 * cuenta para poder mostrar saldo inicial y final por cuenta sin recalcular
 * nada en la vista.
 */
export async function getCloseData(userId: string, month: string | undefined): Promise<CloseData> {
  const db = getDb();
  const today = todayInArgentina();
  const period = resolvePeriod(month, today);
  const periodStart = new Date(`${period.start}T00:00:00.000Z`);

  const [accounts, movements, entries, payments] = await Promise.all([
    getAccountsWithBalances(userId),
    db.transaction.findMany({
      where: { userId, occurredOn: { gte: periodStart } },
      include: { sourceAccount: true, destinationAccount: true, category: true, correction: true },
      orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }],
    }),
    db.ledgerEntry.findMany({
      where: {
        userId,
        transaction: { voidedAt: null, occurredOn: { gte: periodStart } },
      },
      select: {
        accountId: true,
        amountCents: true,
        transaction: { select: { occurredOn: true } },
      },
    }),
    resilientRead(() =>
      db.upcomingPayment.findMany({
        // `userId` va al lado de `OR`: Prisma los combina con AND, así que el
        // propietario acota las dos ramas del OR, no compite con ellas.
        where: {
          userId,
          OR: [
            { status: "PENDING" },
            {
              status: "PAID",
              dueOn: {
                gte: periodStart,
                lt: shiftDays(period.end, 1),
              },
            },
          ],
        },
        include: { plannedAccount: true },
        orderBy: { dueOn: "asc" },
      }),
      reportSecondaryRead("/mi-realidad/cierre", "upcoming-payments"),
    ),
  ]);

  const activity = await getAccountActivity(userId);
  const within = new Map<string, bigint>();
  const after = new Map<string, bigint>();
  for (const entry of entries) {
    const day = dayString(entry.transaction.occurredOn);
    const bucket = day > period.end ? after : within;
    bucket.set(entry.accountId, (bucket.get(entry.accountId) ?? 0n) + entry.amountCents);
  }

  return {
    today,
    period,
    patrimonyNowCents: accounts.reduce((sum, account) => sum + account.balanceCents, 0n),
    accounts: accounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      archived: account.status === "ARCHIVED",
      balanceCents: account.balanceCents,
      withinCents: within.get(account.id) ?? 0n,
      afterCents: after.get(account.id) ?? 0n,
      lastActivityOn: activity.get(account.id)?.lastActivityOn ?? null,
    })),
    movements: movements.map(toRealityMovement),
    payments: (payments ?? []).map((payment) => ({
      id: payment.id,
      concept: payment.concept,
      dueOn: dayString(payment.dueOn),
      amountCents: payment.estimatedCents,
      accountName: payment.plannedAccount.name,
      status: payment.status,
    })),
    paymentsAvailable: payments !== null,
  };
}

export async function getActData(userId: string): Promise<{
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
    getAccountsWithBalances(userId),
    db.upcomingPayment.findMany({
      where: { userId, status: "PENDING" },
      include: { plannedAccount: true },
      orderBy: { dueOn: "asc" },
    }),
    db.transaction.count({ where: { userId, voidedAt: null } }),
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

// ---------------------------------------------------------------------------
// En qué se fue la plata (/en-que-se-fue). Sólo lee.
// ---------------------------------------------------------------------------

export interface SpendingData {
  today: string;
  month: string;
  period: Period;
  /** Meses con actividad registrada, del más nuevo al más viejo. */
  availableMonths: string[];
  movements: SpendingMovement[];
  previousMovements: SpendingMovement[];
  /** Ventana ancha para poder reconocer una cadencia mensual. */
  recurringWindow: SpendingMovement[];
  display: DisplayContext;
  hasAccounts: boolean;
}

/** Meses hacia atrás que se miran para detectar un gasto que se repite. */
const RECURRENCE_WINDOW_MONTHS = 6;

/**
 * Lectura de /en-que-se-fue.
 *
 * Trae tres conjuntos de una sola vez porque el reporte necesita los tres: el
 * mes pedido, el anterior para comparar, y una ventana de seis meses para poder
 * reconocer una cadencia. Mirando sólo el mes en curso no se vería ni una sola
 * repetición mensual, que es justamente lo que hace útil al reporte.
 *
 * Los importes vienen valuados en la moneda de lectura: un total que mezcle
 * pesos y dólares sin convertir no significa nada.
 */
export async function getSpendingData(
  userId: string,
  requestedMonth: string | undefined,
  now = new Date(),
): Promise<SpendingData> {
  const db = getDb();
  const today = todayInArgentina(now);
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(requestedMonth ?? "") ? requestedMonth! : today.slice(0, 7);
  const period = monthPeriod(month, today);
  const previous = monthPeriod(previousMonth(month), today);

  const windowStart = new Date(`${period.start}T00:00:00.000Z`);
  windowStart.setUTCMonth(windowStart.getUTCMonth() - RECURRENCE_WINDOW_MONTHS);

  const [book, accountCount, rows, oldest] = await Promise.all([
    resolveRateBook(userId, now),
    db.account.count({ where: { userId } }),
    db.transaction.findMany({
      where: { userId, occurredOn: { gte: windowStart, lt: shiftDays(period.end, 1) } },
      include: { sourceAccount: true, category: true },
      orderBy: [{ occurredOn: "asc" }, { createdAt: "asc" }],
    }),
    db.transaction.findFirst({
      where: { userId, voidedAt: null },
      orderBy: { occurredOn: "asc" },
      select: { occurredOn: true },
    }),
  ]);

  const { valued, context } = valueAmounts(
    rows.map((row) => ({ balanceCents: row.amountCents, currency: row.currency })),
    book,
    now,
  );

  const movements: SpendingMovement[] = rows.map((row, index) => ({
    id: row.id,
    occurredOn: dayString(row.occurredOn),
    amountCents: valued[index] ?? 0n,
    type: row.type,
    voided: row.voidedAt !== null,
    categoryId: row.categoryId,
    categoryName: row.category?.name ?? null,
    // La descripción es el nombre del comercio: lo importado ya llegó
    // normalizado, y lo cargado a mano es lo que la persona escribió.
    merchant: row.description || row.category?.name || "Sin detalle",
    accountId: row.sourceAccountId,
    accountName: row.sourceAccount.name,
  }));

  const inPeriod = (day: string, bounds: { start: string; end: string }) =>
    day >= bounds.start && day <= bounds.end;

  return {
    today,
    month,
    period,
    availableMonths: listMonths(oldest ? dayString(oldest.occurredOn) : today, today),
    movements: movements.filter((movement) => inPeriod(movement.occurredOn, period)),
    previousMovements: movements.filter((movement) => inPeriod(movement.occurredOn, previous)),
    recurringWindow: movements,
    display: context,
    hasAccounts: accountCount > 0,
  };
}

/**
 * Meses entre el primer movimiento y hoy, del más nuevo al más viejo.
 *
 * Se listan sólo los meses que la persona puede haber vivido dentro de Doleth:
 * ofrecer un selector con meses anteriores a su primer movimiento la invitaría a
 * mirar pantallas vacías y a dudar de si faltan datos.
 */
function listMonths(firstDay: string, today: string): string[] {
  const months: string[] = [];
  let cursor = today.slice(0, 7);
  const floor = firstDay.slice(0, 7);
  // Tope defensivo: diez años de meses alcanzan y evitan un bucle infinito si
  // alguna fecha viniera corrupta.
  for (let guard = 0; guard < 120 && cursor >= floor; guard += 1) {
    months.push(cursor);
    cursor = previousMonth(cursor);
  }
  return months;
}
