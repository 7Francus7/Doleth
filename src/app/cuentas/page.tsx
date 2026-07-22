import Link from "next/link";
import { setAccountStatusAction } from "../actions/finance";
import { OperationalShell } from "../../components/finance/OperationalShell";
import { formatCents } from "../../lib/finance/domain";
import { getAccountsWithBalances } from "../../lib/finance/data";
import styles from "../../components/finance/finance.module.css";

export const dynamic = "force-dynamic";

const typeLabel: Record<string, string> = { CASH: "Efectivo", BANK: "Banco", WALLET: "Billetera virtual", SAVINGS: "Ahorro", OTHER: "Otra" };

export default async function AccountsPage() {
  const accounts = await getAccountsWithBalances();
  return (
    <OperationalShell eyebrow="Base financiera" title="Cuentas" intro="El saldo actual se deriva del saldo inicial y de todos los movimientos confirmados." actions={<Link className={styles.primaryLink} href="/cuentas/nueva">Crear cuenta</Link>}>
      {accounts.length ? <div className={styles.list}>{accounts.map((account) => (
        <div className={styles.listItem} key={account.id}>
          <div className={styles.itemCopy}><span className={styles.itemTitle}>{account.name}</span><span className={styles.itemMeta}>{typeLabel[account.type]} · {account.currency} · {account.status === "ACTIVE" ? "Activa" : "Archivada"}</span></div>
          <div className={styles.itemCopy}>
            <span className={styles.itemAmount}>{account.balanceCents < 0n ? "-" : ""}${formatCents(account.balanceCents < 0n ? -account.balanceCents : account.balanceCents)}</span>
            <form action={setAccountStatusAction}>
              <input name="id" type="hidden" value={account.id} /><input name="status" type="hidden" value={account.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE"} />
              <button className={styles.quietButton} type="submit">{account.status === "ACTIVE" ? "Archivar" : "Reactivar"}</button>
            </form>
          </div>
        </div>
      ))}</div> : <p className={styles.empty}>Todavía no hay cuentas. Creá la primera con su saldo real.</p>}
    </OperationalShell>
  );
}
