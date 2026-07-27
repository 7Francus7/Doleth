import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import { MovementForm } from "../../../../components/finance/MovementForm";
import { OperationalShell } from "../../../../components/finance/OperationalShell";
import { requireOnboardedUser } from "../../../../lib/auth/guards";
import { getDb } from "../../../../lib/db";
import { formatCents, todayInArgentina } from "../../../../lib/finance/domain";

export const dynamic = "force-dynamic";

export default async function EditMovementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireOnboardedUser(`/movimientos/${id}/editar`);
  const db = getDb();
  // Las tres consultas acotadas al propietario: ni el movimiento ni las opciones
  // del formulario pueden venir de otra cuenta.
  const [movement, accounts, categories] = await Promise.all([
    db.transaction.findFirst({ where: { id, userId: user.id } }),
    db.account.findMany({ where: { userId: user.id, status: "ACTIVE" }, orderBy: { name: "asc" } }),
    db.category.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
  ]);
  if (!movement || movement.voidedAt) notFound();
  return <OperationalShell eyebrow="Corrección auditable" title="Corregir movimiento" intro="Doleth anulará el original y creará un reemplazo enlazado. El historial no se reescribe."><MovementForm accounts={accounts} categories={categories} idempotencyKey={randomUUID()} today={todayInArgentina()} defaults={{ id, type: movement.type, amount: formatCents(movement.amountCents), occurredOn: movement.occurredOn.toISOString().slice(0, 10), sourceAccountId: movement.sourceAccountId, ...(movement.destinationAccountId ? { destinationAccountId: movement.destinationAccountId } : {}), ...(movement.categoryId ? { categoryId: movement.categoryId } : {}), ...(movement.description ? { description: movement.description } : {}) }} /></OperationalShell>;
}
