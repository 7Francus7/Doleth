import Link from "next/link";
import { randomUUID } from "node:crypto";
import { MovementForm } from "../../../components/finance/MovementForm";
import { OperationalShell } from "../../../components/finance/OperationalShell";
import { getMovementFormData } from "../../../lib/finance/data";
import { requireOnboardedUser } from "../../../lib/auth/guards";
import styles from "../../../components/finance/finance.module.css";

export const dynamic = "force-dynamic";

export default async function NewMovementPage() {
  const user = await requireOnboardedUser("/movimientos/nuevo");
  const data = await getMovementFormData(user.id);
  return <OperationalShell eyebrow="Carga rápida" title="Registrar movimiento" intro="Importe primero. La fecha ya está puesta en hoy según Argentina.">{data.accounts.length ? <MovementForm {...data} idempotencyKey={randomUUID()} /> : <p className={styles.empty}>Necesitás al menos una cuenta activa. <Link className={styles.textLink} href="/cuentas/nueva">Crear cuenta</Link></p>}</OperationalShell>;
}
