import Link from "next/link";
import { OperationalShell } from "../../../components/finance/OperationalShell";
import { UpcomingPaymentForm } from "../../../components/finance/UpcomingPaymentForm";
import { getMovementFormData } from "../../../lib/finance/data";
import styles from "../../../components/finance/finance.module.css";

export const dynamic = "force-dynamic";

export default async function NewUpcomingPaymentPage() {
  const data = await getMovementFormData();
  return <OperationalShell eyebrow="Compromiso futuro" title="Registrar próximo pago" intro="El importe puede ser estimado. Se volverá gasto real recién cuando lo marques como pagado.">{data.accounts.length ? <UpcomingPaymentForm accounts={data.accounts} today={data.today} /> : <p className={styles.empty}>Necesitás una cuenta activa. <Link className={styles.textLink} href="/cuentas/nueva">Crear cuenta</Link></p>}</OperationalShell>;
}
