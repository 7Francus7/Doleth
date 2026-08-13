import { notFound } from "next/navigation";
import { setAccountStatusAction } from "../../actions/finance";
import { OperationalShell } from "../../../components/finance/OperationalShell";
import { AccountDetail } from "../../../features/accounts/AccountDetail";
import { accountRow } from "../../../features/accounts/model";
import { requireOnboardedUser } from "../../../lib/auth/guards";
import { getAccountDetail } from "../../../lib/finance/data";
import styles from "../../../features/accounts/accounts.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cuenta" };

export default async function AccountDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireOnboardedUser(`/cuentas/${id}`);
  const data = await getAccountDetail(user.id, id);
  if (!data) notFound();
  const row = accountRow({ ...data, originalCents: data.balanceCents, valuedCents: data.balanceCents });
  const nextStatus = data.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE";
  return <OperationalShell back={{ href: "/cuentas", label: "Volver a cuentas" }} eyebrow={data.status === "ACTIVE" ? "Cuenta activa" : "Cuenta archivada"} title={data.name} wide>
    <AccountDetail account={{ id, name: data.name, typeLabel: row.typeLabel, currency: data.currency, balance: row.balance, status: data.status, liability: data.liability, creditCard: data.creditCard, recent: data.recent }} statusAction={<form action={setAccountStatusAction} className={styles.statusForm}><input name="id" type="hidden" value={id} /><input name="status" type="hidden" value={nextStatus} /><button type="submit">{nextStatus === "ARCHIVED" ? "Archivar" : "Reactivar"}</button><small>{nextStatus === "ARCHIVED" ? "Conserva historia; deja de aparecer al registrar." : "Disponible otra vez para nuevos movimientos."}</small></form>} />
  </OperationalShell>;
}
