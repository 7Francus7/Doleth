import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import { MovementForm } from "../../../../components/finance/MovementForm";
import { OperationalShell } from "../../../../components/finance/OperationalShell";
import { getDb } from "../../../../lib/db";
import { formatCentsAR } from "../../../../lib/finance/amount";
import { sanitizeReturnPath } from "../../../../lib/navigation/returnPath";
import { todayInArgentina } from "../../../../lib/finance/domain";

export const dynamic = "force-dynamic";
export const metadata = { title: "Corregir movimiento" };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function EditMovementPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const returnTo = sanitizeReturnPath(first((await searchParams).volver), `/movimientos/${id}`);
  const db = getDb();
  const [movement, accounts, categories] = await Promise.all([
    db.transaction.findUnique({ where: { id }, include: { sourceAccount: true } }),
    db.account.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!movement || movement.voidedAt) notFound();

  const occurredOn = movement.occurredOn.toISOString().slice(0, 10);

  return (
    <OperationalShell
      back={{ href: returnTo, label: "Volver" }}
      eyebrow="Corrección auditable"
      title="Corregir movimiento"
      intro="Doleth anulará el original y creará un reemplazo enlazado. El historial no se reescribe."
    >
      <MovementForm
        accounts={accounts}
        categories={categories}
        idempotencyKey={randomUUID()}
        mode="correction"
        returnTo={returnTo}
        today={todayInArgentina()}
        original={{
          amount: formatCentsAR(movement.amountCents),
          accountName: movement.sourceAccount.name,
          occurredOn,
          description: movement.description ?? "",
        }}
        defaults={{
          id,
          type: movement.type,
          amount: formatCentsAR(movement.amountCents),
          occurredOn,
          sourceAccountId: movement.sourceAccountId,
          ...(movement.destinationAccountId ? { destinationAccountId: movement.destinationAccountId } : {}),
          ...(movement.categoryId ? { categoryId: movement.categoryId } : {}),
          ...(movement.description ? { description: movement.description } : {}),
        }}
      />
    </OperationalShell>
  );
}
