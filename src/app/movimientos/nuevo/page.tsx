import Link from "next/link";
import { randomUUID } from "node:crypto";
import { MovementForm } from "../../../components/finance/MovementForm";
import { OperationalShell } from "../../../components/finance/OperationalShell";
import { getMovementFormData } from "../../../lib/finance/data";
import { requireOnboardedUser } from "../../../lib/auth/guards";
import { getDb } from "../../../lib/db";
import { formatCentsAR } from "../../../lib/finance/amount";
import { buildRepeatDefaults, canRepeat, isReferenceOnly } from "../../../lib/finance/repeatMovement";
import { sanitizeReturnPath } from "../../../lib/navigation/returnPath";
import { todayInArgentina } from "../../../lib/finance/domain";
import styles from "../../../components/finance/finance.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Registrar movimiento" };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function NewMovementPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireOnboardedUser("/movimientos/nuevo");
  const query = await searchParams;
  const returnTo = sanitizeReturnPath(first(query.volver), "/movimientos");
  const repeatId = first(query.repetir);
  const data = await getMovementFormData(user.id);

  // "Registrar otro igual": se copia la intención, nunca la identidad ni la fecha.
  // El id del original llega por la URL, así que la búsqueda va acotada al dueño:
  // repetir un movimiento ajeno no copia nada, simplemente no lo encuentra.
  let repeatDefaults: ReturnType<typeof buildRepeatDefaults> | undefined;
  let referenceOnly = false;
  if (repeatId) {
    const source = await getDb().transaction.findFirst({
      where: { id: repeatId, userId: user.id },
      include: { correction: true },
    });
    if (source) {
      const repeatable = {
        id: source.id,
        type: source.type,
        amountCents: source.amountCents,
        sourceAccountId: source.sourceAccountId,
        destinationAccountId: source.destinationAccountId,
        categoryId: source.categoryId,
        description: source.description,
        voidedAt: source.voidedAt,
        correctionId: source.correction?.id ?? null,
      };
      if (canRepeat(repeatable)) {
        repeatDefaults = buildRepeatDefaults(repeatable, todayInArgentina(), formatCentsAR);
        referenceOnly = isReferenceOnly(repeatable);
      }
    }
  }

  return (
    <OperationalShell
      back={{ href: returnTo, label: "Volver" }}
      eyebrow="Carga rápida"
      title="Registrar movimiento"
      intro="Importe primero. La fecha ya está puesta en hoy según Argentina."
    >
      {data.accounts.length ? (
        <MovementForm
          {...data}
          idempotencyKey={randomUUID()}
          returnTo={returnTo}
          {...(repeatDefaults ? { defaults: repeatDefaults, basedOnPrevious: true, referenceOnly } : {})}
        />
      ) : (
        <p className={styles.empty}>
          Necesitás al menos una cuenta activa. <Link className={styles.textLink} href="/cuentas/nueva">Crear cuenta</Link>
        </p>
      )}
    </OperationalShell>
  );
}
