import Link from "next/link";
import { setAccountStatusAction } from "../actions/finance";
import { OperationalShell } from "../../components/finance/OperationalShell";
import { SensitiveAmount } from "../../components/privacy/AmountPrivacy";
import { EmptyState } from "../../design-system/feedback";
import { formatCents } from "../../lib/finance/domain";
import { getAccountsWithBalances } from "../../lib/finance/data";
import { requireOnboardedUser } from "../../lib/auth/guards";
import styles from "../../components/finance/finance.module.css";

import { accountTypeLabel } from "../../lib/finance/accountKind";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cuentas" };


export default async function AccountsPage() {
  const user = await requireOnboardedUser("/cuentas");
  const accounts = await getAccountsWithBalances(user.id);
  return (
    <OperationalShell eyebrow="Base financiera" title="Cuentas" intro="El saldo actual se deriva del saldo inicial y de todos los movimientos confirmados." actions={<Link className={styles.primaryLink} href="/cuentas/nueva">Crear cuenta</Link>}>
      {accounts.length ? <div className={styles.list}>{accounts.map((account) => (
        <div className={styles.listItem} key={account.id}>
          <div className={styles.itemCopy}><span className={styles.itemTitle}>{account.name}</span><span className={styles.itemMeta}>{accountTypeLabel(account.type)} · {account.currency} · {account.status === "ACTIVE" ? "Activa" : "Archivada"}</span></div>
          <div className={styles.itemCopy}>
            <span className={styles.itemAmount}>
              <SensitiveAmount>{account.balanceCents < 0n ? "-" : ""}${formatCents(account.balanceCents < 0n ? -account.balanceCents : account.balanceCents)}</SensitiveAmount>
            </span>
            <Link className={styles.textLink} href={`/movimientos?accountId=${account.id}`}>Ver movimientos</Link>
            <form action={setAccountStatusAction}>
              <input name="id" type="hidden" value={account.id} /><input name="status" type="hidden" value={account.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE"} />
              <button className={styles.quietButton} type="submit">{account.status === "ACTIVE" ? "Archivar" : "Reactivar"}</button>
            </form>
          </div>
        </div>
      ))}</div> : (
        <EmptyState
          description="Podés agregar efectivo, banco, billetera virtual u otra cuenta."
          primaryAction={<Link className={styles.primaryLink} href="/cuentas/nueva">Crear primera cuenta</Link>}
          title="Empezá por representar dónde está tu dinero."
        />
      )}
    </OperationalShell>
  );
}
