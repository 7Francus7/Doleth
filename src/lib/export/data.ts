import "server-only";
import { getDb } from "../db";
import type { CsvCell, ExportDataset } from "./format";

const day = (date: Date) => date.toISOString().slice(0, 10);
const instant = (date: Date) => date.toISOString();

export interface FinancialExportSnapshot {
  meta: {
    schemaVersion: 1;
    exportedAt: string;
    timezone: "America/Argentina/Buenos_Aires";
    monetaryUnit: "cents";
    restoreSupported: false;
  };
  accounts: {
    id: string;
    name: string;
    type: string;
    currency: string;
    initialBalanceCents: string;
    currentBalanceCents: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }[];
  movements: {
    id: string;
    type: string;
    amountCents: string;
    occurredOn: string;
    description: string | null;
    sourceAccount: string;
    destinationAccount: string | null;
    category: string | null;
    status: "ACTIVE" | "VOIDED" | "CORRECTED";
    voidReason: string | null;
    correctedFromId: string | null;
    createdAt: string;
    updatedAt: string;
  }[];
  upcomingPayments: {
    id: string;
    concept: string;
    estimatedCents: string;
    dueOn: string;
    frequency: string | null;
    plannedAccount: string;
    status: string;
    transactionId: string | null;
    createdAt: string;
    updatedAt: string;
  }[];
  investments: {
    id: string;
    name: string;
    kind: string;
    symbol: string | null;
    currency: string;
    investedCents: string;
    currentValueCents: string;
    note: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
  }[];
}

/**
 * Copia de datos de **un** usuario.
 *
 * `userId` viene siempre de la sesión validada (`requireUser()`), nunca de la
 * URL, del formulario ni de un encabezado: la ruta de exportación no acepta un
 * identificador del cliente. Las cinco consultas llevan `where: { userId }`, sin
 * excepción. Antes de que la app fuera multiusuario estas lecturas eran
 * globales, y con una sola persona en la base daban el mismo resultado; con dos
 * usuarios eso habría entregado las finanzas de todos a cualquiera que
 * descargara su copia. `export-isolation.test.ts` ejecuta esa situación contra
 * PostgreSQL con dos usuarios y falla si alguna consulta vuelve a ser global.
 */
export async function createFinancialExport(userId: string): Promise<FinancialExportSnapshot> {
  const db = getDb();
  const [accounts, ledgerTotals, movements, upcomingPayments, investments] = await Promise.all([
    db.account.findMany({ where: { userId }, orderBy: [{ status: "asc" }, { createdAt: "asc" }] }),
    db.ledgerEntry.groupBy({
      by: ["accountId"],
      where: { userId, transaction: { voidedAt: null } },
      _sum: { amountCents: true },
    }),
    db.transaction.findMany({
      where: { userId },
      include: {
        category: true,
        correction: { select: { id: true } },
        destinationAccount: true,
        sourceAccount: true,
      },
      orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }],
    }),
    db.upcomingPayment.findMany({
      where: { userId },
      include: { plannedAccount: true },
      orderBy: [{ dueOn: "asc" }, { createdAt: "asc" }],
    }),
    db.investment.findMany({ where: { userId }, orderBy: [{ status: "asc" }, { createdAt: "asc" }] }),
  ]);
  const totals = new Map(
    ledgerTotals.map((row) => [row.accountId, row._sum.amountCents ?? 0n]),
  );

  return {
    meta: {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      timezone: "America/Argentina/Buenos_Aires",
      monetaryUnit: "cents",
      restoreSupported: false,
    },
    accounts: accounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      currency: account.currency,
      initialBalanceCents: account.initialBalanceCents.toString(),
      currentBalanceCents: (
        account.initialBalanceCents + (totals.get(account.id) ?? 0n)
      ).toString(),
      status: account.status,
      createdAt: instant(account.createdAt),
      updatedAt: instant(account.updatedAt),
    })),
    movements: movements.map((movement) => ({
      id: movement.id,
      type: movement.type,
      amountCents: movement.amountCents.toString(),
      occurredOn: day(movement.occurredOn),
      description: movement.description,
      sourceAccount: movement.sourceAccount.name,
      destinationAccount: movement.destinationAccount?.name ?? null,
      category: movement.category?.name ?? null,
      status:
        movement.correction !== null
          ? "CORRECTED"
          : movement.voidedAt !== null
            ? "VOIDED"
            : "ACTIVE",
      voidReason: movement.voidReason,
      correctedFromId: movement.correctedFromId,
      createdAt: instant(movement.createdAt),
      updatedAt: instant(movement.updatedAt),
    })),
    upcomingPayments: upcomingPayments.map((payment) => ({
      id: payment.id,
      concept: payment.concept,
      estimatedCents: payment.estimatedCents.toString(),
      dueOn: day(payment.dueOn),
      frequency: payment.frequency,
      plannedAccount: payment.plannedAccount.name,
      status: payment.status,
      transactionId: payment.transactionId,
      createdAt: instant(payment.createdAt),
      updatedAt: instant(payment.updatedAt),
    })),
    investments: investments.map((investment) => ({
      id: investment.id,
      name: investment.name,
      kind: investment.kind,
      symbol: investment.symbol,
      currency: investment.currency,
      investedCents: investment.investedCents.toString(),
      currentValueCents: investment.currentValueCents.toString(),
      note: investment.note,
      status: investment.status,
      createdAt: instant(investment.createdAt),
      updatedAt: instant(investment.updatedAt),
    })),
  };
}

export function datasetRows(
  snapshot: FinancialExportSnapshot,
  dataset: ExportDataset,
): { headers: string[]; rows: CsvCell[][] } {
  if (dataset === "cuentas") {
    return {
      headers: [
        "id", "nombre", "tipo", "moneda", "saldo_inicial_cents",
        "saldo_actual_cents", "estado", "creado_en", "actualizado_en",
      ],
      rows: snapshot.accounts.map((row) => [
        row.id, row.name, row.type, row.currency, row.initialBalanceCents,
        row.currentBalanceCents, row.status, row.createdAt, row.updatedAt,
      ]),
    };
  }
  if (dataset === "proximos-pagos") {
    return {
      headers: [
        "id", "concepto", "estimado_cents", "vence_el", "frecuencia",
        "cuenta_prevista", "estado", "movimiento_id", "creado_en", "actualizado_en",
      ],
      rows: snapshot.upcomingPayments.map((row) => [
        row.id, row.concept, row.estimatedCents, row.dueOn, row.frequency,
        row.plannedAccount, row.status, row.transactionId, row.createdAt, row.updatedAt,
      ]),
    };
  }
  if (dataset === "inversiones") {
    return {
      headers: [
        "id", "nombre", "tipo", "simbolo", "moneda", "invertido_cents",
        "valor_actual_cents", "nota", "estado", "creado_en", "actualizado_en",
      ],
      rows: snapshot.investments.map((row) => [
        row.id, row.name, row.kind, row.symbol, row.currency, row.investedCents,
        row.currentValueCents, row.note, row.status, row.createdAt, row.updatedAt,
      ]),
    };
  }
  return {
    headers: [
      "id", "tipo", "importe_cents", "fecha", "descripcion", "cuenta_origen",
      "cuenta_destino", "categoria", "estado", "motivo_anulacion",
      "corrige_a_id", "creado_en", "actualizado_en",
    ],
    rows: snapshot.movements.map((row) => [
      row.id, row.type, row.amountCents, row.occurredOn, row.description,
      row.sourceAccount, row.destinationAccount, row.category, row.status,
      row.voidReason, row.correctedFromId, row.createdAt, row.updatedAt,
    ]),
  };
}
