import { notFound, redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { MovementForm } from "../../../../components/finance/MovementForm";
import { OperationalShell } from "../../../../components/finance/OperationalShell";
import { requireOnboardedUser } from "../../../../lib/auth/guards";
import { getDb } from "../../../../lib/db";
import { loadSelectableCategories } from "../../../../lib/finance/data";
import { formatCentsAR } from "../../../../lib/finance/amount";
import { sanitizeReturnPath } from "../../../../lib/navigation/returnPath";
import { todayInArgentina } from "../../../../lib/finance/domain";

export const dynamic = "force-dynamic";
export const metadata = { title: "Corregir movimiento" };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function EditMovementPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const user = await requireOnboardedUser(`/movimientos/${id}/editar`);
  const returnTo = sanitizeReturnPath(first((await searchParams).volver), `/movimientos/${id}`);
  const db = getDb();
  // Las tres consultas acotadas al propietario: ni el movimiento ni las opciones
  // del formulario pueden venir de otra cuenta.
  const [movement, accounts] = await Promise.all([
    db.transaction.findFirst({ where: { id, userId: user.id }, include: { sourceAccount: true } }),
    db.account.findMany({ where: { userId: user.id, status: "ACTIVE" }, orderBy: { name: "asc" } }),
  ]);
  if (!movement) notFound();
  // La categoría del movimiento viaja aunque esté archivada: corregir el importe
  // de un gasto viejo no puede cambiarle la categoría por no tenerla en la lista.
  const categories = await loadSelectableCategories(user.id, movement.categoryId);
  if (movement.voidedAt) {
    const replacement = await db.transaction.findFirst({
      where: { userId: user.id, correctedFromId: movement.id },
      select: { id: true },
    });
    if (replacement) {
      redirect(`/movimientos/${replacement.id}?volver=${encodeURIComponent(returnTo)}`);
    }
    notFound();
  }

  const occurredOn = movement.occurredOn.toISOString().slice(0, 10);

  return (
    <OperationalShell
      wide
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
