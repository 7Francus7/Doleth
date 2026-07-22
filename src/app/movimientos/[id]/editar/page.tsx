import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import { MovementForm } from "../../../../components/finance/MovementForm";
import { OperationalShell } from "../../../../components/finance/OperationalShell";
import { getDb } from "../../../../lib/db";
import { formatCents, todayInArgentina } from "../../../../lib/finance/domain";

export const dynamic = "force-dynamic";

export default async function EditMovementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const [movement, accounts, categories] = await Promise.all([
    db.transaction.findUnique({ where: { id } }),
    db.account.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!movement || movement.voidedAt) notFound();
  return <OperationalShell eyebrow="Corrección auditable" title="Corregir movimiento" intro="Doleth anulará el original y creará un reemplazo enlazado. El historial no se reescribe."><MovementForm accounts={accounts} categories={categories} idempotencyKey={randomUUID()} today={todayInArgentina()} defaults={{ id, type: movement.type, amount: formatCents(movement.amountCents), occurredOn: movement.occurredOn.toISOString().slice(0, 10), sourceAccountId: movement.sourceAccountId, ...(movement.destinationAccountId ? { destinationAccountId: movement.destinationAccountId } : {}), ...(movement.categoryId ? { categoryId: movement.categoryId } : {}), ...(movement.description ? { description: movement.description } : {}) }} /></OperationalShell>;
}
