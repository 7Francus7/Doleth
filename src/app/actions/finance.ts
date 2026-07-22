"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "../../lib/db";
import {
  createPostings,
  dateOnly,
  idempotencyDecision,
  parseMoneyToCents,
  paymentConversionDecision,
  requirePositiveMoney,
  type MovementType,
} from "../../lib/finance/domain";

export interface FinanceActionState {
  ok: boolean;
  message: string;
}

const errorState = (error: unknown): FinanceActionState => ({
  ok: false,
  message: error instanceof Error ? error.message : "No pudimos guardar el cambio.",
});

const value = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

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

export async function createInvestmentAction(
  _previous: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  try {
    const name = value(formData, "name");
    const kind = value(formData, "kind");
    const symbol = value(formData, "symbol") || undefined;
    const note = value(formData, "note") || undefined;
    const currency = (value(formData, "currency") || "ARS").toUpperCase();
    const investedCents = requirePositiveMoney(value(formData, "invested"));
    const currentValueCents = parseMoneyToCents(value(formData, "currentValue"));
    if (name.length < 2 || name.length > 80) throw new Error("El nombre debe tener entre 2 y 80 caracteres.");
    if (!validInvestmentKind(kind)) throw new Error("Seleccioná un tipo de inversión válido.");
    if (currency !== "ARS") throw new Error("Esta vista consolida inversiones en ARS.");
    if (currentValueCents < 0n) throw new Error("El valor actual no puede ser negativo.");
    if (symbol && symbol.length > 20) throw new Error("El símbolo admite hasta 20 caracteres.");
    if (note && note.length > 160) throw new Error("La nota admite hasta 160 caracteres.");

    await getDb().investment.create({
      data: {
        name,
        kind,
        currency,
        investedCents,
        currentValueCents,
        ...(symbol ? { symbol } : {}),
        ...(note ? { note } : {}),
      },
    });
    revalidatePath("/inversiones");
    return { ok: true, message: "Inversión registrada. Ya forma parte de tu cartera." };
  } catch (error) {
    return errorState(error);
  }
}

export async function archiveInvestmentAction(formData: FormData): Promise<void> {
  const id = value(formData, "id");
  const status = value(formData, "status");
  if (!id || (status !== "ACTIVE" && status !== "ARCHIVED")) throw new Error("Estado de inversión inválido.");
  await getDb().investment.update({ where: { id }, data: { status } });
  revalidatePath("/inversiones");
}

export async function createAccountAction(
  _previous: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  try {
    const name = value(formData, "name");
    const type = value(formData, "type");
    const currency = value(formData, "currency").toUpperCase();
    const initialBalanceCents = parseMoneyToCents(value(formData, "initialBalance"), true);
    if (name.length < 2 || name.length > 60) throw new Error("El nombre debe tener entre 2 y 60 caracteres.");
    if (!["CASH", "BANK", "WALLET", "SAVINGS", "OTHER"].includes(type)) {
      throw new Error("Seleccioná un tipo de cuenta válido.");
    }
    if (currency !== "ARS") throw new Error("Este corte consolida cuentas en ARS. Otras monedas requieren conversión explícita.");

    await getDb().account.create({
      data: { name, type: type as "CASH", currency, initialBalanceCents },
    });
    refreshFinance();
    return { ok: true, message: "Cuenta creada. El saldo inicial ya forma parte de tu patrimonio." };
  } catch (error) {
    return errorState(error);
  }
}

export async function setAccountStatusAction(formData: FormData): Promise<void> {
  const id = value(formData, "id");
  const status = value(formData, "status");
  if (!id || (status !== "ACTIVE" && status !== "ARCHIVED")) throw new Error("Estado de cuenta inválido.");
  await getDb().account.update({ where: { id }, data: { status } });
  refreshFinance();
}

export async function createMovementAction(
  _previous: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  try {
    const db = getDb();
    const type = value(formData, "type");
    if (!validMovementType(type)) throw new Error("Seleccioná un tipo de movimiento.");
    const amountCents = requirePositiveMoney(value(formData, "amount"));
    const occurredOn = dateOnly(value(formData, "occurredOn"));
    const sourceAccountId = value(formData, "sourceAccountId");
    const destinationAccountId = value(formData, "destinationAccountId") || undefined;
    const categoryId = value(formData, "categoryId") || undefined;
    const description = value(formData, "description") || undefined;
    const idempotencyKey = value(formData, "idempotencyKey");
    if (idempotencyKey.length < 8) throw new Error("Recargá el formulario antes de guardar.");
    if (description && description.length > 160) throw new Error("La descripción admite hasta 160 caracteres.");

    const existing = await db.transaction.findUnique({ where: { idempotencyKey } });
    if (idempotencyDecision(existing?.id ?? null) === "RETURN_EXISTING") {
      return { ok: true, message: "Movimiento ya registrado. No se creó un duplicado." };
    }

    const accountIds = [sourceAccountId, destinationAccountId].filter(Boolean) as string[];
    const accounts = await db.account.findMany({ where: { id: { in: accountIds }, status: "ACTIVE" } });
    if (accounts.length !== new Set(accountIds).size) throw new Error("Una de las cuentas no está activa.");
    if (accounts.some((account) => account.currency !== "ARS")) throw new Error("El resumen actual solo admite cuentas en ARS.");

    if (type !== "TRANSFER") {
      if (!categoryId) throw new Error("Seleccioná una categoría.");
      const category = await db.category.findUnique({ where: { id: categoryId } });
      if (!category || category.kind !== type) throw new Error("La categoría no corresponde al tipo de movimiento.");
    }

    const postings = createPostings(type, amountCents, sourceAccountId, destinationAccountId);
    try {
      await db.transaction.create({
        data: {
          type,
          amountCents,
          occurredOn,
          sourceAccountId,
          ...(destinationAccountId ? { destinationAccountId } : {}),
          ...(categoryId ? { categoryId } : {}),
          ...(description ? { description } : {}),
          idempotencyKey,
          entries: { create: postings },
        },
      });
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
        return { ok: true, message: "Movimiento ya registrado. No se creó un duplicado." };
      }
      throw error;
    }

    refreshFinance();
    return { ok: true, message: "Movimiento registrado. Saldos y resumen ya están actualizados." };
  } catch (error) {
    return errorState(error);
  }
}

export async function voidMovementAction(formData: FormData): Promise<void> {
  const id = value(formData, "id");
  const reason = value(formData, "reason");
  if (!id) throw new Error("Movimiento inválido.");
  if (reason.length < 4) throw new Error("Indicá brevemente el motivo de la anulación.");
  await getDb().transaction.updateMany({
    where: { id, voidedAt: null },
    data: { voidedAt: new Date(), voidReason: reason },
  });
  refreshFinance();
}

export async function correctMovementAction(
  _previous: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  try {
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
    if (idempotencyKey.length < 8) throw new Error("Recargá el formulario antes de guardar.");
    if (description && description.length > 160) throw new Error("La descripción admite hasta 160 caracteres.");
    const postings = createPostings(type, amountCents, sourceAccountId, destinationAccountId);

    await db.$transaction(async (tx) => {
      const original = await tx.transaction.findUnique({ where: { id: originalId } });
      if (!original || original.voidedAt) throw new Error("El movimiento ya fue anulado o no existe.");
      const accountIds = [sourceAccountId, destinationAccountId].filter(Boolean) as string[];
      const accounts = await tx.account.findMany({ where: { id: { in: accountIds }, status: "ACTIVE", currency: "ARS" } });
      if (accounts.length !== new Set(accountIds).size) throw new Error("Una de las cuentas no está activa o no usa ARS.");
      if (type !== "TRANSFER") {
        if (!categoryId) throw new Error("Seleccioná una categoría.");
        const category = await tx.category.findUnique({ where: { id: categoryId } });
        if (!category || category.kind !== type) throw new Error("La categoría no corresponde al tipo de movimiento.");
      }
      await tx.transaction.update({
        where: { id: originalId },
        data: { voidedAt: new Date(), voidReason: "Corregido por un movimiento reemplazante" },
      });
      await tx.transaction.create({
        data: {
          type,
          amountCents,
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
    });
    refreshFinance();
    return { ok: true, message: "Corrección guardada. El original quedó anulado y auditable." };
  } catch (error) {
    return errorState(error);
  }
}

export async function createUpcomingPaymentAction(
  _previous: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  try {
    const concept = value(formData, "concept");
    const estimatedCents = requirePositiveMoney(value(formData, "amount"));
    const dueOn = dateOnly(value(formData, "dueOn"));
    const frequency = value(formData, "frequency") || undefined;
    const plannedAccountId = value(formData, "plannedAccountId");
    if (concept.length < 2 || concept.length > 100) throw new Error("El concepto debe tener entre 2 y 100 caracteres.");
    const account = await getDb().account.findFirst({ where: { id: plannedAccountId, status: "ACTIVE" } });
    if (!account) throw new Error("Seleccioná una cuenta activa.");
    await getDb().upcomingPayment.create({
      data: { concept, estimatedCents, dueOn, plannedAccountId, ...(frequency ? { frequency } : {}) },
    });
    refreshFinance();
    return { ok: true, message: "Próximo pago registrado." };
  } catch (error) {
    return errorState(error);
  }
}

export async function payUpcomingPaymentAction(
  _previous: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  try {
    const paymentId = value(formData, "paymentId");
    const occurredOn = dateOnly(value(formData, "occurredOn"));
    const db = getDb();
    await db.$transaction(async (tx) => {
      const payment = await tx.upcomingPayment.findUnique({ where: { id: paymentId } });
      if (!payment) throw new Error("Próximo pago inexistente.");
      if (paymentConversionDecision(payment.status, payment.transactionId) === "RETURN_EXISTING") return;
      const category = await tx.category.findUnique({ where: { slug: "other-expense" } });
      if (!category) throw new Error("Ejecutá el seed de categorías antes de registrar pagos.");
      const movement = await tx.transaction.create({
        data: {
          type: "EXPENSE",
          amountCents: payment.estimatedCents,
          occurredOn,
          sourceAccountId: payment.plannedAccountId,
          categoryId: category.id,
          description: payment.concept,
          idempotencyKey: `upcoming-payment:${payment.id}`,
          entries: { create: createPostings("EXPENSE", payment.estimatedCents, payment.plannedAccountId) },
        },
      });
      await tx.upcomingPayment.update({ where: { id: payment.id }, data: { status: "PAID", transactionId: movement.id } });
    });
    refreshFinance();
    return { ok: true, message: "Pago convertido en gasto. No se generarán duplicados." };
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      return { ok: true, message: "El pago ya estaba convertido. No se creó otro gasto." };
    }
    return errorState(error);
  }
}
