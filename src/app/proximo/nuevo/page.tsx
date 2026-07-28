import type { Metadata } from "next";
import Link from "next/link";
import { OperationalShell } from "../../../components/finance/OperationalShell";
import { UpcomingPaymentForm } from "../../../components/finance/UpcomingPaymentForm";
import { getMovementFormData } from "../../../lib/finance/data";
import { requireOnboardedUser } from "../../../lib/auth/guards";
import styles from "../../../components/finance/finance.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Registrar próximo pago" };

export default async function NewUpcomingPaymentPage() {
  const user = await requireOnboardedUser("/proximo/nuevo");
  const data = await getMovementFormData(user.id);
  return <OperationalShell eyebrow="Compromiso futuro" title="Registrar próximo pago" intro="El importe es el que vos preveas. Recién se convierte en un gasto real cuando confirmás el pago.">{data.accounts.length ? <UpcomingPaymentForm accounts={data.accounts} today={data.today} /> : <p className={styles.empty}>Necesitás una cuenta activa. <Link className={styles.textLink} href="/cuentas/nueva">Crear cuenta</Link></p>}</OperationalShell>;
}
