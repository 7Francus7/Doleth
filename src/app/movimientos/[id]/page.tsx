import Link from "next/link";
import { notFound } from "next/navigation";
import { OperationalShell } from "../../../components/finance/OperationalShell";
import { VoidMovementFlow } from "../../../components/finance/VoidMovementFlow";
import { SensitiveAmount } from "../../../components/privacy/AmountPrivacy";
import { requireOnboardedUser } from "../../../lib/auth/guards";
import { formatCentsAR } from "../../../lib/finance/amount";
import { getOwnedMovement } from "../../../lib/finance/data";
import { describeDateAR } from "../../../lib/finance/movementDate";
import { canRepeat, currentVersionId } from "../../../lib/finance/repeatMovement";
import { sanitizeReturnPath } from "../../../lib/navigation/returnPath";
import { formatDateAR, todayInArgentina } from "../../../lib/finance/domain";
import styles from "../../../components/finance/finance.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Movimiento" };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const typeLabels = { EXPENSE: "Gasto", INCOME: "Ingreso", TRANSFER: "Transferencia" } as const;

export default async function MovementDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const user = await requireOnboardedUser(`/movimientos/${id}`);
  const backHref = sanitizeReturnPath(first((await searchParams).volver), "/movimientos");
  // La consulta incluye el propietario: un id ajeno devuelve 404, no un 403 que
  // confirmaría que ese movimiento existe.
  const movement = await getOwnedMovement(user.id, id);
  if (!movement) notFound();

  const today = todayInArgentina();
  const occurredOn = movement.occurredOn.toISOString().slice(0, 10);
  const repeatable = canRepeat({
    id: movement.id,
    type: movement.type,
    amountCents: movement.amountCents,
    sourceAccountId: movement.sourceAccountId,
    destinationAccountId: movement.destinationAccountId,
    categoryId: movement.categoryId,
    description: movement.description,
    voidedAt: movement.voidedAt,
    correctionId: movement.correction?.id ?? null,
  });
  const selfHref = `/movimientos/${id}?volver=${encodeURIComponent(backHref)}`;

  return (
    <OperationalShell
      back={{ href: backHref, label: "Volver a movimientos" }}
      eyebrow={movement.voidedAt ? "Movimiento anulado" : "Movimiento confirmado"}
      title={movement.description || movement.category?.name || "Movimiento"}
      actions={
        <>
          {!movement.voidedAt ? <Link className={styles.primaryLink} href={`/movimientos/${id}/editar?volver=${encodeURIComponent(selfHref)}`}>Corregir</Link> : null}
          {repeatable ? <Link className={styles.quietLink} href={`/movimientos/nuevo?repetir=${id}&volver=${encodeURIComponent(selfHref)}`}>Registrar otro igual</Link> : null}
        </>
      }
    >
      <section className={styles.panel}>
        <dl className={styles.detailGrid}>
          <div className={styles.detailRow}><dt>Tipo</dt><dd>{typeLabels[movement.type]}</dd></div>
          <div className={styles.detailRow}><dt>Importe</dt><dd><SensitiveAmount>${formatCentsAR(movement.amountCents)}</SensitiveAmount></dd></div>
          <div className={styles.detailRow}><dt>Fecha</dt><dd>{describeDateAR(occurredOn, today)}</dd></div>
          <div className={styles.detailRow}><dt>Origen</dt><dd>{movement.sourceAccount.name}</dd></div>
          {movement.destinationAccount ? <div className={styles.detailRow}><dt>Destino</dt><dd>{movement.destinationAccount.name}</dd></div> : null}
          {movement.category ? <div className={styles.detailRow}><dt>Categoría</dt><dd>{movement.category.name}</dd></div> : null}
          <div className={styles.detailRow}><dt>Estado</dt><dd>{movement.voidedAt ? `Anulado · ${movement.voidReason}` : "Confirmado"}</dd></div>
          {movement.correction ? <div className={styles.detailRow}><dt>Corrección</dt><dd><Link className={styles.textLink} href={`/movimientos/${currentVersionId({ id: movement.id, type: movement.type, amountCents: movement.amountCents, sourceAccountId: movement.sourceAccountId, destinationAccountId: movement.destinationAccountId, categoryId: movement.categoryId, description: movement.description, voidedAt: movement.voidedAt, correctionId: movement.correction.id })}`}>Ver reemplazo</Link></dd></div> : null}
          {movement.correctedFrom ? <div className={styles.detailRow}><dt>Reemplaza</dt><dd><Link className={styles.textLink} href={`/movimientos/${movement.correctedFrom.id}`}>Ver original</Link></dd></div> : null}
        </dl>
        {!movement.voidedAt ? (
          <div className={styles.dangerZone}>
            <VoidMovementFlow
              movementId={id}
              returnTo={backHref}
              summary={{
                typeLabel: typeLabels[movement.type],
                amount: formatCentsAR(movement.amountCents),
                accountName: movement.sourceAccount.name,
                date: formatDateAR(movement.occurredOn),
              }}
            />
          </div>
        ) : null}
      </section>
    </OperationalShell>
  );
}
