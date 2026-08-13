import Link from "next/link";
import { notFound } from "next/navigation";
import { OperationalShell } from "../../../components/finance/OperationalShell";
import { VoidMovementFlow } from "../../../components/finance/VoidMovementFlow";
import { MovementDetail } from "../../../features/movements/MovementDetail";
import { requireOnboardedUser } from "../../../lib/auth/guards";
import { formatCentsAR } from "../../../lib/finance/amount";
import { getOwnedMovement } from "../../../lib/finance/data";
import { formatDateAR, todayInArgentina } from "../../../lib/finance/domain";
import { describeDateAR } from "../../../lib/finance/movementDate";
import { canRepeat, currentVersionId } from "../../../lib/finance/repeatMovement";
import { sanitizeReturnPath } from "../../../lib/navigation/returnPath";

export const dynamic = "force-dynamic";
export const metadata = { title: "Movimiento" };

const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
const typeLabels = { EXPENSE: "Gasto", INCOME: "Ingreso", TRANSFER: "Transferencia" } as const;

export default async function MovementDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const user = await requireOnboardedUser(`/movimientos/${id}`);
  const backHref = sanitizeReturnPath(first((await searchParams).volver), "/movimientos");
  const movement = await getOwnedMovement(user.id, id);
  if (!movement) notFound();

  const occurredOn = movement.occurredOn.toISOString().slice(0, 10);
  const repeatable = canRepeat({
    id: movement.id, type: movement.type, amountCents: movement.amountCents,
    sourceAccountId: movement.sourceAccountId, destinationAccountId: movement.destinationAccountId,
    categoryId: movement.categoryId, description: movement.description, voidedAt: movement.voidedAt,
    correctionId: movement.correction?.id ?? null,
  });
  const selfHref = `/movimientos/${id}?volver=${encodeURIComponent(backHref)}`;
  const replacementId = movement.correction ? currentVersionId({
    id: movement.id, type: movement.type, amountCents: movement.amountCents,
    sourceAccountId: movement.sourceAccountId, destinationAccountId: movement.destinationAccountId,
    categoryId: movement.categoryId, description: movement.description, voidedAt: movement.voidedAt,
    correctionId: movement.correction.id,
  }) : null;

  return <OperationalShell
    back={{ href: backHref, label: "Volver a movimientos" }}
    eyebrow={movement.voidedAt ? "Movimiento anulado" : "Evidencia del movimiento"}
    title={movement.description || movement.category?.name || typeLabels[movement.type]}
    wide
  >
    <MovementDetail
      actions={<>
        {!movement.voidedAt ? <Link href={`/movimientos/${id}/editar?volver=${encodeURIComponent(selfHref)}`}>Corregir</Link> : null}
        {repeatable ? <Link href={`/movimientos/nuevo?repetir=${id}&volver=${encodeURIComponent(selfHref)}`}>Registrar otro igual</Link> : null}
      </>}
      danger={!movement.voidedAt ? <VoidMovementFlow movementId={id} returnTo={backHref} summary={{ typeLabel: typeLabels[movement.type], amount: formatCentsAR(movement.amountCents), accountName: movement.sourceAccount.name, date: formatDateAR(movement.occurredOn) }} /> : null}
      movement={{
        type: movement.type, amount: formatCentsAR(movement.amountCents), currency: movement.currency,
        date: describeDateAR(occurredOn, todayInArgentina()), description: movement.description,
        category: movement.category?.name ?? null, sourceAccount: movement.sourceAccount.name,
        destinationAccount: movement.destinationAccount?.name ?? null,
        destinationAmount: movement.destinationAmountCents && movement.destinationAccount ? `${movement.destinationAccount.currency} ${formatCentsAR(movement.destinationAmountCents)}` : null,
        voided: movement.voidedAt !== null, voidReason: movement.voidReason,
        correction: replacementId ? <Link href={`/movimientos/${replacementId}?volver=${encodeURIComponent(backHref)}`}>Ver reemplazo</Link> : null,
        correctedFrom: movement.correctedFrom ? <Link href={`/movimientos/${movement.correctedFrom.id}?volver=${encodeURIComponent(backHref)}`}>Ver original</Link> : null,
      }}
    />
  </OperationalShell>;
}
