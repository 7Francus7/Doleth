"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "../../lib/db";
import { UnauthorizedError, requireOnboardedUserForAction } from "../../lib/auth/guards";
import { successForCorrection, successForMovement, successForVoid } from "../../lib/finance/actionFeedback";
import { formatCentsAR } from "../../lib/finance/amount";
import { FALLBACK_EXPENSE_SLUG } from "../../lib/finance/categories";
import { isAccountKind, isLiabilityAccount } from "../../lib/finance/accountKind";
import { CURRENCY_LABELS, SUPPORTED_CURRENCIES, isSupportedCurrency } from "../../lib/finance/currency";
import { parseQuantityInput } from "../../lib/finance/holdings";
import { financeError, toSafeError } from "../../lib/finance/errors";
import { sanitizeReturnPath } from "../../lib/navigation/returnPath";
import { logServerError } from "../../lib/observability";
import {
  createPostings,
  dateOnly,
  formatDateAR,
  idempotencyDecision,
  parseMoneyToCents,
  paymentConversionDecision,
  requirePositiveMoney,
  todayInArgentina,
  type MovementType,
} from "../../lib/finance/domain";
import { nextMonthSameDay } from "../../lib/finance/projection";

export interface FinanceActionData {
  transactionId?: string;
  transactionType?: MovementType;
  /** Importe ya formateado en lectura argentina; el dominio guarda centavos. */
  amount?: string;
  sourceAccountName?: string;
  destinationAccountName?: string;
  effectiveDate?: string;
  redirectTo?: string;
}

/**
 * Server Actions financieras.
 *
 * Invariantes que sostienen el aislamiento:
 *   1. El propietario sale de `requireOnboardedUserForAction()`. Ningún campo del
 *      formulario puede aportar userId: no se lee de `formData` en ningún lado.
 *   2. Todo recurso referido por id (cuenta origen, cuenta destino, categoría,
 *      movimiento original, próximo pago) se busca filtrando por ese propietario.
 *      Un id ajeno no da "prohibido", da "no existe".
 *   3. Toda escritura graba `userId`, incluidos los asientos del ledger.
 */

export interface FinanceActionState {
  ok: boolean;
  message: string;
  /** Segunda línea del resultado: qué cambió, con importe y cuentas reales. */
  detail?: string;
  error?: { code: string; field?: string };
  data?: FinanceActionData;
}

const UNAUTHORIZED_MESSAGE = "Tu sesión venció. Volvé a iniciar sesión para guardar este cambio.";

/**
 * Nunca devuelve el mensaje de una excepción desconocida: Prisma, SQL o red se
 * traducen a copy humano. Solo los errores propios llegan tal cual.
 *
 * La falta de sesión se resuelve antes que nada y conserva su propio código: un
 * problema de autorización no puede quedar disfrazado de fallo genérico ni
 * confundirse con un error de validación del formulario.
 */
const errorState = (error: unknown, operation: string): FinanceActionState => {
  if (error instanceof UnauthorizedError) {
    return {
      ok: false,
      message: error.message || UNAUTHORIZED_MESSAGE,
      error: { code: "unauthorized" },
    };
  }
  const safe = toSafeError(error);
  if (safe.code === "unexpected") {
    logServerError({ route: "/actions/finance", operation, code: safe.code });
  }
  return {
    ok: false,
    message: safe.message,
    error: { code: safe.code, ...(safe.field ? { field: safe.field } : {}) },
  };
};

const value = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

// Protección de doble-envío sin cambio de esquema: si acaba de crearse una
// entidad idéntica dentro de esta ventana, se trata como el mismo intento y no
// se duplica. Cubre el caso real de doble-clic o reenvío del formulario. La
// robustez frente a concurrencia verdadera requiere una restricción única
// (migración futura) y queda documentada como deuda.
const DEDUPE_WINDOW_MS = 60_000;
const recentThreshold = () => new Date(Date.now() - DEDUPE_WINDOW_MS);

function validMovementType(input: string): input is MovementType {
  return input === "EXPENSE" || input === "INCOME" || input === "TRANSFER";
}

function refreshFinance() {
  revalidatePath("/ahora");
  revalidatePath("/movimientos");
  revalidatePath("/proximo");
  revalidatePath("/cuentas");
}

const INVESTMENT_KINDS = [
  "STOCKS",
  "CRYPTO",
  "FUND",
  "BOND",
  "REAL_ESTATE",
  "CASH_EQUIVALENT",
  "OTHER",
] as const;

type InvestmentKind = (typeof INVESTMENT_KINDS)[number];

function validInvestmentKind(input: string): input is InvestmentKind {
  return (INVESTMENT_KINDS as readonly string[]).includes(input);
}

/**
 * Lee la moneda que llega de un formulario.
 *
 * Hasta la fundación multimoneda, cualquier valor distinto de ARS se rechazaba.
 * Ahora se acepta lo que el producto sabe cotizar y se rechaza el resto con su
 * nombre: guardar una moneda que después no se puede convertir dejaría un
 * agujero permanente en el patrimonio de esa persona.
 */
function readCurrency(formData: FormData, fallback = "ARS") {
  const raw = (value(formData, "currency") || fallback).toUpperCase();
  if (!isSupportedCurrency(raw)) {
    throw financeError(
      "currency-unsupported",
      `Doleth todavía no sabe cotizar ${raw}. Por ahora maneja ${SUPPORTED_CURRENCIES.join(" y ")}.`,
      "currency",
    );
  }
  return raw;
}

export async function createInvestmentAction(
  _previous: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  try {
    const user = await requireOnboardedUserForAction();
    const name = value(formData, "name");
    const kind = value(formData, "kind");
    const symbol = value(formData, "symbol") || undefined;
    const note = value(formData, "note") || undefined;
    const currency = readCurrency(formData);
    const investedCents = requirePositiveMoney(value(formData, "invested"));
    const currentValueCents = parseMoneyToCents(value(formData, "currentValue"));
    // La cantidad es opcional: un departamento no tiene unidades, y obligarlo a
    // declararlas sería inventar una precisión que no existe. Cuando está, el
    // valor de la tenencia pasa a salir de multiplicarla por su precio.
    const rawQuantity = value(formData, "quantity");
    const quantityMicros = rawQuantity ? parseQuantityInput(rawQuantity) : null;
    if (name.length < 2 || name.length > 80) throw new Error("El nombre debe tener entre 2 y 80 caracteres.");
    if (!validInvestmentKind(kind)) throw new Error("Seleccioná un tipo de inversión válido.");
    if (currentValueCents < 0n) throw new Error("El valor actual no puede ser negativo.");
    if (symbol && symbol.length > 20) throw new Error("El símbolo admite hasta 20 caracteres.");
    if (note && note.length > 160) throw new Error("La nota admite hasta 160 caracteres.");
    if (rawQuantity && quantityMicros === null) {
      throw financeError("quantity-invalid", "Escribí una cantidad válida, por ejemplo 12 o 0,5.", "quantity");
    }
    // Una cantidad sin símbolo no se puede valuar: quedaría contando unidades de
    // algo que Doleth no sabe cotizar, y el valor seguiría saliendo del número
    // escrito a mano. Se avisa en vez de aceptarlo y no cumplir.
    if (quantityMicros !== null && !symbol) {
      throw financeError(
        "symbol-required",
        "Para valuar por cantidad hace falta el símbolo, por ejemplo AAPL o BTC.",
        "symbol",
      );
    }

    const recentInvestment = await getDb().investment.findFirst({
      where: {
        userId: user.id,
        name,
        kind,
        currency,
        investedCents,
        currentValueCents,
        createdAt: { gte: recentThreshold() },
      },
    });
    if (recentInvestment) return { ok: true, message: "Inversión ya registrada. No se creó un duplicado." };

    await getDb().investment.create({
      data: {
        userId: user.id,
        name,
        kind,
        currency,
        investedCents,
        currentValueCents,
        ...(quantityMicros !== null ? { quantityMicros } : {}),
        ...(symbol ? { symbol } : {}),
        ...(note ? { note } : {}),
      },
    });
    revalidatePath("/inversiones");
    return { ok: true, message: "Inversión registrada. Ya forma parte de tu cartera." };
  } catch (error) {
    return errorState(error, "create-investment");
  }
}

export async function archiveInvestmentAction(formData: FormData): Promise<void> {
  const user = await requireOnboardedUserForAction();
  const id = value(formData, "id");
  const status = value(formData, "status");
  if (!id || (status !== "ACTIVE" && status !== "ARCHIVED")) throw new Error("Estado de inversión inválido.");
  const updated = await getDb().investment.updateMany({ where: { id, userId: user.id }, data: { status } });
  if (updated.count === 0) throw new Error("Inversión inexistente.");
  revalidatePath("/inversiones");
}

/**
 * Lee los datos propios de una tarjeta de crédito.
 *
 * El día de cierre y el de vencimiento son obligatorios porque sin ellos la
 * tarjeta no responde la única pregunta por la que existe como entidad aparte:
 * cuándo hay que pagarla. Los días fuera del calendario se rechazan acá y la
 * base los vuelve a rechazar: un 31 en un mes de 30 se resuelve al derivar la
 * fecha concreta, no guardando un día imposible.
 */
function readCreditCardFields(formData: FormData) {
  const closingDay = Number(value(formData, "closingDay"));
  const dueDay = Number(value(formData, "dueDay"));
  const last4 = value(formData, "last4");
  const brand = value(formData, "brand");

  const validDay = (day: number) => Number.isInteger(day) && day >= 1 && day <= 31;
  if (!validDay(closingDay)) {
    throw financeError("closing-day-invalid", "El día de cierre tiene que estar entre 1 y 31.", "closingDay");
  }
  if (!validDay(dueDay)) {
    throw financeError("due-day-invalid", "El día de vencimiento tiene que estar entre 1 y 31.", "dueDay");
  }
  if (last4 && !/^\d{4}$/.test(last4)) {
    throw financeError("last4-invalid", "Escribí los últimos cuatro dígitos, o dejalo vacío.", "last4");
  }

  return {
    closingDay,
    dueDay,
    ...(last4 ? { last4 } : {}),
    ...(brand ? { brand } : {}),
  };
}

export async function createAccountAction(
  _previous: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  try {
    const user = await requireOnboardedUserForAction();
    const name = value(formData, "name");
    const type = value(formData, "type");
    const currency = readCurrency(formData);
    const initialBalanceCents = parseMoneyToCents(value(formData, "initialBalance"), true);
    if (name.length < 2 || name.length > 60) throw new Error("El nombre debe tener entre 2 y 60 caracteres.");
    if (!isAccountKind(type)) throw new Error("Seleccioná un tipo de cuenta válido.");

    // Una tarjeta trae datos que ninguna otra cuenta tiene, y sin ellos no se
    // puede saber cuándo cierra ni cuándo vence: se exigen al crearla, no
    // después, para que no exista una tarjeta a medias.
    const card = isLiabilityAccount(type) ? readCreditCardFields(formData) : null;

    const recentAccount = await getDb().account.findFirst({
      where: {
        userId: user.id,
        name,
        type,
        currency,
        initialBalanceCents,
        createdAt: { gte: recentThreshold() },
      },
    });
    if (recentAccount) return { ok: true, message: "Cuenta ya registrada. No se creó un duplicado." };

    await getDb().account.create({
      data: {
        userId: user.id,
        name,
        type,
        currency,
        initialBalanceCents,
        // La tarjeta se crea junto con su cuenta: el nested create de Prisma
        // resuelve las dos en una sola sentencia, así que no puede quedar una
        // cuenta de tipo tarjeta sin su fecha de cierre.
        // Sin `userId`: la relación compuesta (accountId, userId) lo hereda de la
        // cuenta que se está creando, igual que los asientos del ledger.
        // Repetirlo es inválido para Prisma y la FK compuesta igual verifica el
        // propietario.
        ...(card ? { creditCard: { create: card } } : {}),
      },
    });
    refreshFinance();
    return {
      ok: true,
      message: card
        ? "Tarjeta creada. Su saldo cuenta como deuda y no como dinero disponible."
        : "Cuenta creada. El saldo inicial ya forma parte de tu patrimonio.",
    };
  } catch (error) {
    return errorState(error, "create-account");
  }
}

export async function setAccountStatusAction(formData: FormData): Promise<void> {
  const user = await requireOnboardedUserForAction();
  const id = value(formData, "id");
  const status = value(formData, "status");
  if (!id || (status !== "ACTIVE" && status !== "ARCHIVED")) throw new Error("Estado de cuenta inválido.");
  const updated = await getDb().account.updateMany({ where: { id, userId: user.id }, data: { status } });
  if (updated.count === 0) throw new Error("Cuenta inexistente.");
  refreshFinance();
}

export async function updateAccountMetadataAction(
  _previous: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  try {
    const user = await requireOnboardedUserForAction();
    const id = value(formData, "id");
    const name = value(formData, "name");
    if (!id) throw new Error("Cuenta inexistente.");
    if (name.length < 2 || name.length > 60) throw new Error("El nombre debe tener entre 2 y 60 caracteres.");
    const account = await getDb().account.findFirst({ where: { id, userId: user.id }, include: { creditCard: true } });
    if (!account) throw new Error("Cuenta inexistente.");
    const card = account.creditCard ? readCreditCardFields(formData) : null;
    await getDb().$transaction(async (tx) => {
      await tx.account.update({ where: { id_userId: { id, userId: user.id } }, data: { name } });
      if (card && account.creditCard) {
        await tx.creditCard.update({ where: { id: account.creditCard.id }, data: card });
      }
    });
    refreshFinance();
    return { ok: true, message: "Cuenta actualizada. Saldo inicial, tipo y moneda no cambiaron." };
  } catch (error) {
    return errorState(error, "update-account-metadata");
  }
}

interface MovementAccount {
  id: string;
  name: string;
  currency: string;
}

/**
 * Decide la moneda de un movimiento y, si hace falta, cuánto entra en destino.
 *
 * La moneda de un movimiento es siempre la de su cuenta de origen: es de ahí de
 * donde sale la plata, y es la única lectura que no depende de una cotización.
 *
 * Una transferencia entre cuentas de monedas distintas es el único caso donde el
 * ledger necesita dos importes. Doleth pide el segundo en vez de calcularlo con
 * la cotización del día, y eso es deliberado: cuando alguien cambia pesos por
 * dólares, el precio que le hicieron es un hecho de esa operación, no el
 * promedio del mercado. Calcularlo sería reemplazar un dato real por una
 * estimación, y además dejaría el saldo de la cuenta en dólares dependiendo de
 * un número que puede cambiar mañana.
 */
function resolveMovementCurrency(
  type: MovementType,
  accounts: readonly MovementAccount[],
  input: { sourceAccountId: string; destinationAccountId?: string; rawDestinationAmount: string },
): { currency: string; destinationAmountCents: bigint | undefined } {
  const byId = new Map(accounts.map((account) => [account.id, account]));
  const source = byId.get(input.sourceAccountId);
  if (!source) throw financeError("account-unavailable", "Una de las cuentas no está activa.", "sourceAccountId");
  if (!isSupportedCurrency(source.currency)) {
    throw financeError(
      "currency-unsupported",
      `La cuenta ${source.name} está en ${source.currency} y Doleth todavía no sabe cotizar esa moneda.`,
      "sourceAccountId",
    );
  }

  const destination = input.destinationAccountId ? byId.get(input.destinationAccountId) : null;
  const crossesCurrencies = type === "TRANSFER" && destination !== null && destination !== undefined
    && destination.currency !== source.currency;

  if (!crossesCurrencies) {
    if (input.rawDestinationAmount) {
      throw financeError(
        "destination-amount-unexpected",
        "Las dos cuentas usan la misma moneda: entra exactamente lo que sale.",
        "destinationAmount",
      );
    }
    return { currency: source.currency, destinationAmountCents: undefined };
  }

  if (!isSupportedCurrency(destination.currency)) {
    throw financeError(
      "currency-unsupported",
      `La cuenta ${destination.name} está en ${destination.currency} y Doleth todavía no sabe cotizar esa moneda.`,
      "destinationAccountId",
    );
  }
  if (!input.rawDestinationAmount) {
    throw financeError(
      "destination-amount-required",
      `Este cambio cruza monedas: decinos cuántos ${CURRENCY_LABELS[destination.currency]} entraron en ${destination.name}.`,
      "destinationAmount",
    );
  }

  return { currency: source.currency, destinationAmountCents: requirePositiveMoney(input.rawDestinationAmount) };
}

export async function createMovementAction(
  _previous: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  try {
    const user = await requireOnboardedUserForAction();
    const db = getDb();
    const type = value(formData, "type");
    if (!validMovementType(type)) throw financeError("type-invalid", "Seleccioná un tipo de movimiento.", "type");
    const amountCents = requirePositiveMoney(value(formData, "amount"));
    const occurredOn = dateOnly(value(formData, "occurredOn"));
    const sourceAccountId = value(formData, "sourceAccountId");
    const destinationAccountId = value(formData, "destinationAccountId") || undefined;
    const categoryId = value(formData, "categoryId") || undefined;
    const description = value(formData, "description") || undefined;
    const idempotencyKey = value(formData, "idempotencyKey");
    const redirectTo = sanitizeReturnPath(value(formData, "volver") || null, "/movimientos");
    if (idempotencyKey.length < 8) throw financeError("stale-form", "Recargá el formulario antes de guardar.");
    if (description && description.length > 160) {
      throw financeError("description-too-long", "La descripción admite hasta 160 caracteres.", "description");
    }

    const existing = await db.transaction.findUnique({
      // La clave de idempotencia es única *por usuario*: dos personas pueden
      // reenviar el mismo formulario sin pisarse.
      where: { userId_idempotencyKey: { userId: user.id, idempotencyKey } },
      include: { sourceAccount: true, destinationAccount: true },
    });
    if (idempotencyDecision(existing?.id ?? null) === "RETURN_EXISTING") {
      const feedback = successForMovement({
        type: existing!.type,
        amountCents: existing!.amountCents,
        sourceAccountName: existing!.sourceAccount.name,
        destinationAccountName: existing!.destinationAccount?.name,
      });
      return {
        ok: true,
        message: feedback.message,
        detail: `${feedback.detail} Ya estaba registrado: no se creó un duplicado.`,
        data: { transactionId: existing!.id, transactionType: existing!.type, redirectTo },
      };
    }

    const accountIds = [sourceAccountId, destinationAccountId].filter(Boolean) as string[];
    // Los ids llegan del formulario, así que la consulta los acota al dueño: una
    // cuenta ajena no da "prohibido", da "no está activa", que es lo mismo que
    // vería si no existiera.
    const accounts = await db.account.findMany({
      where: { id: { in: accountIds }, userId: user.id, status: "ACTIVE" },
    });
    if (accounts.length !== new Set(accountIds).size) {
      throw financeError("account-unavailable", "Una de las cuentas no está activa.", "sourceAccountId");
    }

    const { currency, destinationAmountCents } = resolveMovementCurrency(type, accounts, {
      sourceAccountId,
      ...(destinationAccountId ? { destinationAccountId } : {}),
      rawDestinationAmount: value(formData, "destinationAmount"),
    });

    if (type !== "TRANSFER") {
      if (!categoryId) throw financeError("category-required", "Seleccioná una categoría.", "categoryId");
      const category = await db.category.findFirst({ where: { id: categoryId, userId: user.id } });
      if (!category || category.kind !== type) {
        throw financeError("category-mismatch", "La categoría no corresponde al tipo de movimiento.", "categoryId");
      }
    }

    const byId = new Map(accounts.map((account) => [account.id, account.name]));
    const postings = createPostings(type, amountCents, sourceAccountId, destinationAccountId, destinationAmountCents);
    let createdId: string;
    try {
      const created = await db.transaction.create({
        data: {
          userId: user.id,
          type,
          amountCents,
          currency,
          ...(destinationAmountCents !== undefined ? { destinationAmountCents } : {}),
          occurredOn,
          sourceAccountId,
          ...(destinationAccountId ? { destinationAccountId } : {}),
          ...(categoryId ? { categoryId } : {}),
          ...(description ? { description } : {}),
          idempotencyKey,
          // La relación compuesta (transactionId, userId) hereda ambos valores
          // del movimiento. Repetir userId dentro del nested create es inválido
          // para Prisma y la FK compuesta igualmente verifica el owner.
          entries: { create: postings },
        },
      });
      createdId = created.id;
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
        // Otro envío del mismo intento ganó la carrera: no se duplica nada.
        const duplicate = await db.transaction.findUnique({
          where: { userId_idempotencyKey: { userId: user.id, idempotencyKey } },
          include: { sourceAccount: true, destinationAccount: true },
        });
        const feedback = successForMovement({
          type,
          amountCents,
          sourceAccountName: duplicate?.sourceAccount.name ?? byId.get(sourceAccountId) ?? "",
          destinationAccountName: duplicate?.destinationAccount?.name,
        });
        return {
          ok: true,
          message: feedback.message,
          detail: `${feedback.detail} Ya estaba registrado: no se creó un duplicado.`,
          ...(duplicate ? { data: { transactionId: duplicate.id, transactionType: type, redirectTo } } : {}),
        };
      }
      throw error;
    }

    refreshFinance();
    const feedback = successForMovement({
      type,
      amountCents,
      sourceAccountName: byId.get(sourceAccountId) ?? "",
      ...(destinationAccountId ? { destinationAccountName: byId.get(destinationAccountId) ?? "" } : {}),
    });
    return {
      ok: true,
      message: feedback.message,
      detail: feedback.detail,
      data: {
        transactionId: createdId,
        transactionType: type,
        amount: formatCentsAR(amountCents),
        sourceAccountName: byId.get(sourceAccountId) ?? "",
        ...(destinationAccountId ? { destinationAccountName: byId.get(destinationAccountId) ?? "" } : {}),
        effectiveDate: occurredOn.toISOString().slice(0, 10),
        redirectTo,
      },
    };
  } catch (error) {
    return errorState(error, "create-movement");
  }
}

export async function voidMovementAction(
  _previous: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  try {
    const user = await requireOnboardedUserForAction();
    const id = value(formData, "id");
    const reason = value(formData, "reason");
    const redirectTo = sanitizeReturnPath(value(formData, "volver") || null, "/movimientos");
    if (!id) throw financeError("movement-invalid", "Movimiento inválido.");
    if (reason.length < 4) throw financeError("reason-required", "Indicá brevemente el motivo de la anulación.", "reason");

    const db = getDb();
    // El `userId` acota el update: un id ajeno no anula nada.
    const updated = await db.transaction.updateMany({
      where: { id, userId: user.id, voidedAt: null },
      data: { voidedAt: new Date(), voidReason: reason },
    });

    // `count === 0` tiene dos causas distintas y no se pueden responder igual:
    // el movimiento ya estaba anulado —reintentar es seguro, el estado final es
    // el mismo— o no es de quien pide. Decir "anulado" cuando no se anuló nada
    // sería mentirle al usuario. Un id ajeno responde lo mismo que uno
    // inexistente, así que la distinción no revela de quién es.
    if (updated.count === 0) {
      const own = await db.transaction.findFirst({ where: { id, userId: user.id }, select: { voidedAt: true } });
      if (!own) throw financeError("movement-missing", "Ese movimiento no existe.");
      const feedback = successForVoid();
      return { ok: true, message: feedback.message, detail: feedback.detail, data: { transactionId: id, redirectTo } };
    }

    refreshFinance();
    const feedback = successForVoid();
    return { ok: true, message: feedback.message, detail: feedback.detail, data: { transactionId: id, redirectTo } };
  } catch (error) {
    return errorState(error, "void-movement");
  }
}

export async function correctMovementAction(
  _previous: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  try {
    const user = await requireOnboardedUserForAction();
    const db = getDb();
    const originalId = value(formData, "originalId");
    const type = value(formData, "type");
    if (!validMovementType(type)) throw new Error("Tipo de movimiento inválido.");
    const amountCents = requirePositiveMoney(value(formData, "amount"));
    const occurredOn = dateOnly(value(formData, "occurredOn"));
    const sourceAccountId = value(formData, "sourceAccountId");
    const destinationAccountId = value(formData, "destinationAccountId") || undefined;
    const categoryId = value(formData, "categoryId") || undefined;
    const description = value(formData, "description") || undefined;
    const idempotencyKey = value(formData, "idempotencyKey");
    const redirectTo = sanitizeReturnPath(value(formData, "volver") || null, "/movimientos");
    if (idempotencyKey.length < 8) throw financeError("stale-form", "Recargá el formulario antes de guardar.");
    if (description && description.length > 160) {
      throw financeError("description-too-long", "La descripción admite hasta 160 caracteres.", "description");
    }
    let replacementId = "";
    await db.$transaction(async (tx) => {
      const original = await tx.transaction.findFirst({ where: { id: originalId, userId: user.id } });
      if (!original || original.voidedAt) {
        throw financeError("already-void", "El movimiento ya fue anulado o no existe.");
      }
      const accountIds = [sourceAccountId, destinationAccountId].filter(Boolean) as string[];
      const accounts = await tx.account.findMany({
        where: { id: { in: accountIds }, userId: user.id, status: "ACTIVE" },
      });
      if (accounts.length !== new Set(accountIds).size) {
        throw financeError("account-unavailable", "Una de las cuentas no está activa.", "sourceAccountId");
      }
      const { currency, destinationAmountCents } = resolveMovementCurrency(type, accounts, {
        sourceAccountId,
        ...(destinationAccountId ? { destinationAccountId } : {}),
        rawDestinationAmount: value(formData, "destinationAmount"),
      });
      const postings = createPostings(type, amountCents, sourceAccountId, destinationAccountId, destinationAmountCents);
      if (type !== "TRANSFER") {
        if (!categoryId) throw financeError("category-required", "Seleccioná una categoría.", "categoryId");
        const category = await tx.category.findFirst({ where: { id: categoryId, userId: user.id } });
        if (!category || category.kind !== type) {
          throw financeError("category-mismatch", "La categoría no corresponde al tipo de movimiento.", "categoryId");
        }
      }
      // Sin `userId`: `update` exige una clave única, y la propiedad ya quedó
      // establecida arriba por el `findFirst` que trajo `original` filtrando por
      // dueño y que aborta la transacción si no encuentra nada.
      await tx.transaction.update({
        where: { id: originalId },
        data: { voidedAt: new Date(), voidReason: "Corregido por un movimiento reemplazante" },
      });
      const replacement = await tx.transaction.create({
        data: {
          userId: user.id,
          type,
          amountCents,
          currency,
          ...(destinationAmountCents !== undefined ? { destinationAmountCents } : {}),
          occurredOn,
          sourceAccountId,
          ...(destinationAccountId ? { destinationAccountId } : {}),
          ...(categoryId ? { categoryId } : {}),
          ...(description ? { description } : {}),
          idempotencyKey,
          correctedFromId: originalId,
          entries: { create: postings },
        },
      });
      replacementId = replacement.id;
    });
    refreshFinance();
    const feedback = successForCorrection();
    return {
      ok: true,
      message: feedback.message,
      detail: feedback.detail,
      data: {
        transactionId: replacementId,
        transactionType: type,
        amount: formatCentsAR(amountCents),
        effectiveDate: occurredOn.toISOString().slice(0, 10),
        // Tras corregir, el contexto natural es el movimiento vigente.
        redirectTo: `/movimientos/${replacementId}?volver=${encodeURIComponent(redirectTo)}`,
      },
    };
  } catch (error) {
    return errorState(error, "correct-movement");
  }
}

export async function createUpcomingPaymentAction(
  _previous: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  try {
    const user = await requireOnboardedUserForAction();
    const db = getDb();
    const concept = value(formData, "concept");
    const estimatedCents = requirePositiveMoney(value(formData, "amount"));
    const dueOn = dateOnly(value(formData, "dueOn"));
    const frequency = value(formData, "frequency") || undefined;
    const plannedAccountId = value(formData, "plannedAccountId");
    if (concept.length < 2 || concept.length > 100) throw new Error("El concepto debe tener entre 2 y 100 caracteres.");
    const account = await db.account.findFirst({
      where: { id: plannedAccountId, userId: user.id, status: "ACTIVE" },
    });
    if (!account) throw new Error("Seleccioná una cuenta activa.");

    // Protección de doble-envío, acotada al dueño: el pago idéntico de otra
    // persona no puede contar como duplicado de éste.
    const recentPayment = await db.upcomingPayment.findFirst({
      where: {
        userId: user.id,
        concept,
        estimatedCents,
        dueOn,
        plannedAccountId,
        status: "PENDING",
        createdAt: { gte: recentThreshold() },
      },
    });
    if (recentPayment) return { ok: true, message: "Próximo pago ya registrado. No se creó un duplicado." };

    await db.upcomingPayment.create({
      data: {
        userId: user.id,
        concept,
        estimatedCents,
        dueOn,
        plannedAccountId,
        ...(frequency ? { frequency } : {}),
      },
    });
    refreshFinance();
    return { ok: true, message: "Próximo pago registrado." };
  } catch (error) {
    return errorState(error, "create-upcoming-payment");
  }
}

/**
 * Confirma un próximo pago: crea el gasto real y marca el pago como pagado en la
 * misma transacción.
 *
 * La idempotencia es real y no depende del formulario: la clave
 * `upcoming-payment:<id>` es única en el ledger, así que un reintento —o dos
 * envíos en paralelo— nunca crean un segundo gasto. Reintentar devuelve el mismo
 * resultado enriquecido en vez de un mensaje genérico.
 *
 * El importe se puede ajustar al confirmar: `estimatedCents` guarda lo que se
 * había previsto y el movimiento guarda lo que realmente salió. El pago previsto
 * nunca se convierte solo; siempre hace falta esta confirmación humana.
 */
export async function payUpcomingPaymentAction(
  _previous: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  // El dueño se recuerda fuera del `try` para que el camino de carrera (P2002)
  // pueda releer el pago sin volver a consultar sin filtro de propietario.
  let ownerId: string | null = null;
  try {
    const user = await requireOnboardedUserForAction();
    ownerId = user.id;
    const paymentId = value(formData, "paymentId");
    const occurredOn = dateOnly(value(formData, "occurredOn"));
    const rawAmount = value(formData, "amount");
    const redirectTo = sanitizeReturnPath(value(formData, "volver") || null, "/proximo");
    if (!paymentId) throw financeError("payment-invalid", "Próximo pago inválido.");
    if (occurredOn.toISOString().slice(0, 10) > todayInArgentina()) {
      throw financeError("future-date", "No se puede confirmar un pago con fecha futura.", "occurredOn");
    }

    const db = getDb();
    let outcome: { transactionId: string; amountCents: bigint; accountName: string; alreadyPaid: boolean } | null = null;

    await db.$transaction(async (tx) => {
      const payment = await tx.upcomingPayment.findFirst({
        where: { id: paymentId, userId: user.id },
        include: { plannedAccount: true, transaction: true },
      });
      if (!payment) throw financeError("payment-missing", "Próximo pago inexistente.");

      if (paymentConversionDecision(payment.status, payment.transactionId) === "RETURN_EXISTING") {
        outcome = {
          transactionId: payment.transactionId!,
          amountCents: payment.transaction?.amountCents ?? payment.estimatedCents,
          accountName: payment.plannedAccount.name,
          alreadyPaid: true,
        };
        return;
      }

      const amountCents = rawAmount ? requirePositiveMoney(rawAmount) : payment.estimatedCents;
      const account = await tx.account.findFirst({
        where: { id: payment.plannedAccountId, userId: user.id, status: "ACTIVE" },
      });
      if (!account) throw financeError("account-unavailable", "La cuenta prevista ya no está activa.");

      // El catálogo de categorías es por usuario desde el corte de identidad: la
      // de respaldo se busca dentro del suyo, no como fila global del seed.
      const category = await tx.category.findFirst({
        where: { userId: user.id, slug: FALLBACK_EXPENSE_SLUG },
      });
      if (!category) {
        throw financeError(
          "seed-missing",
          "Falta la categoría de respaldo. Completá la configuración inicial antes de registrar pagos.",
        );
      }


      const movement = await tx.transaction.create({
        data: {
          userId: user.id,
          type: "EXPENSE",
          amountCents,
          // La moneda del gasto es la de la cuenta de la que sale, igual que en
          // cualquier otro movimiento: confirmar un pago previsto no es un caso
          // aparte del ledger, es un gasto común que se originó en un plan.
          currency: account.currency,
          occurredOn,
          sourceAccountId: payment.plannedAccountId,
          categoryId: category.id,
          description: payment.concept,
          idempotencyKey: `upcoming-payment:${payment.id}`,
          // `amountCents`, no `estimatedCents`: el importe se puede ajustar al
          // confirmar y el asiento tiene que reflejar lo que realmente salió.
          entries: { create: createPostings("EXPENSE", amountCents, payment.plannedAccountId) },
        },
      });
      // Igual que arriba: `payment` se trajo filtrando por dueño, así que la
      // clave primaria alcanza para el update.
      await tx.upcomingPayment.update({
        where: { id: payment.id },
        data: { status: "PAID", transactionId: movement.id },
      });
      outcome = {
        transactionId: movement.id,
        amountCents,
        accountName: payment.plannedAccount.name,
        alreadyPaid: false,
      };
    });

    refreshFinance();
    const result = outcome as { transactionId: string; amountCents: bigint; accountName: string; alreadyPaid: boolean } | null;
    if (!result) throw financeError("payment-missing", "Próximo pago inexistente.");

    return {
      ok: true,
      message: "Pago confirmado.",
      detail: result.alreadyPaid
        ? `Salieron $${formatCentsAR(result.amountCents)} de ${result.accountName}. Ya estaba confirmado: no se creó otro gasto.`
        : `Salieron $${formatCentsAR(result.amountCents)} de ${result.accountName}.`,
      data: {
        transactionId: result.transactionId,
        transactionType: "EXPENSE",
        amount: formatCentsAR(result.amountCents),
        sourceAccountName: result.accountName,
        effectiveDate: occurredOn.toISOString().slice(0, 10),
        redirectTo,
      },
    };
  } catch (error) {
    if (ownerId && typeof error === "object" && error && "code" in error && error.code === "P2002") {
      // Otro envío del mismo intento ganó la carrera: el gasto ya existe.
      const existing = await getDb().upcomingPayment.findFirst({
        where: { id: value(formData, "paymentId"), userId: ownerId },
        include: { plannedAccount: true, transaction: true },
      });
      return {
        ok: true,
        message: "Pago confirmado.",
        detail: existing?.transaction
          ? `Salieron $${formatCentsAR(existing.transaction.amountCents)} de ${existing.plannedAccount.name}. Ya estaba confirmado: no se creó otro gasto.`
          : "Ya estaba confirmado: no se creó otro gasto.",
        ...(existing?.transactionId
          ? { data: { transactionId: existing.transactionId, transactionType: "EXPENSE" as const } }
          : {}),
      };
    }
    return errorState(error, "pay-upcoming-payment");
  }
}

/**
 * Duplica un pago previsto un mes más adelante. Es una acción humana explícita:
 * el dominio no modela recurrencia, así que nada se crea solo. El día se acota
 * al último día del mes destino para no inventar un 31 de febrero.
 */
export async function repeatUpcomingPaymentAction(
  _previous: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  try {
    const user = await requireOnboardedUserForAction();
    const paymentId = value(formData, "paymentId");
    const db = getDb();
    const source = await db.upcomingPayment.findFirst({
      where: { id: paymentId, userId: user.id },
      include: { plannedAccount: true },
    });
    if (!source) throw financeError("payment-missing", "Próximo pago inexistente.");
    if (source.plannedAccount.status !== "ACTIVE") {
      throw financeError("account-unavailable", "La cuenta prevista ya no está activa.");
    }

    const dueOn = dateOnly(nextMonthSameDay(source.dueOn.toISOString().slice(0, 10)));
    const existing = await db.upcomingPayment.findFirst({
      where: {
        userId: user.id,
        concept: source.concept,
        dueOn,
        plannedAccountId: source.plannedAccountId,
        status: "PENDING",
      },
    });
    if (existing) {
      return {
        ok: true,
        message: "Ya existe ese pago previsto.",
        detail: `${source.concept} ya figura para el ${formatDateAR(dueOn)}. No se creó un duplicado.`,
        data: { redirectTo: `/proximo/${existing.id}` },
      };
    }

    const created = await db.upcomingPayment.create({
      data: {
        userId: user.id,
        concept: source.concept,
        estimatedCents: source.estimatedCents,
        dueOn,
        plannedAccountId: source.plannedAccountId,
        ...(source.frequency ? { frequency: source.frequency } : {}),
      },
    });
    refreshFinance();
    return {
      ok: true,
      message: "Pago previsto creado.",
      detail: `${source.concept} quedó cargado para el ${formatDateAR(dueOn)}. Vas a tener que confirmarlo cuando lo pagues.`,
      data: { redirectTo: `/proximo/${created.id}` },
    };
  } catch (error) {
    return errorState(error, "repeat-upcoming-payment");
  }
}
