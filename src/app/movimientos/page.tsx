import Link from "next/link";
import { OperationalShell } from "../../components/finance/OperationalShell";
import { getMovements } from "../../lib/finance/data";
import { formatDateAR, todayInArgentina } from "../../lib/finance/domain";
import styles from "../../components/finance/finance.module.css";

export const dynamic = "force-dynamic";

const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export default async function MovementsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const currentMonth = todayInArgentina().slice(0, 7);
  const month = first(query.month) && /^\d{4}-\d{2}$/.test(first(query.month)!) ? first(query.month)! : currentMonth;
  const requestedType = first(query.type);
  const type = requestedType === "EXPENSE" || requestedType === "INCOME" || requestedType === "TRANSFER" ? requestedType : undefined;
  const accountId = first(query.accountId) || undefined;
  const hasActiveFilters = month !== currentMonth || Boolean(type) || Boolean(accountId);
  const data = await getMovements({ month, ...(type ? { type } : {}), ...(accountId ? { accountId } : {}) });
  return (
    <OperationalShell eyebrow="Registro auditable" title="Movimientos" intro="Los anulados siguen visibles y no participan de saldos ni totales." actions={<Link className={styles.primaryLink} href="/movimientos/nuevo">Registrar movimiento</Link>}>
      <form className={styles.filters}>
        <label className={styles.field}><span>Mes</span><input defaultValue={month} name="month" type="month" /></label>
        <label className={styles.field}><span>Tipo</span><select defaultValue={type ?? ""} name="type"><option value="">Todos</option><option value="EXPENSE">Gastos</option><option value="INCOME">Ingresos</option><option value="TRANSFER">Transferencias</option></select></label>
        <label className={styles.field}><span>Cuenta</span><select defaultValue={accountId ?? ""} name="accountId"><option value="">Todas</option>{data.accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
        <button className={styles.filterButton} type="submit">Aplicar filtros</button>
      </form>
      {data.movements.length ? <div className={styles.list}>{data.movements.map((movement) => (
        <Link className={`${styles.listItem} ${movement.voided ? styles.voided : ""}`} href={`/movimientos/${movement.id}`} key={movement.id}>
          <span className={styles.itemCopy}><span className={styles.itemTitle}>{movement.description}</span><span className={styles.itemMeta}>{formatDateAR(movement.occurredOn)} · {movement.accountName}{movement.voided ? " · Anulado" : ""}</span></span>
          <span className={styles.itemAmount}>{movement.type === "EXPENSE" ? "-" : movement.type === "INCOME" ? "+" : ""}${movement.amount}</span>
        </Link>
      ))}</div> : (
        <section className={styles.empty}>
          <p>{hasActiveFilters ? "No encontramos movimientos con estos filtros." : "Todavía no hay movimientos este mes."}</p>
          {hasActiveFilters ? (
            <Link className={styles.textLink} href="/movimientos">Restablecer filtros</Link>
          ) : (
            <Link className={styles.primaryLink} href="/movimientos/nuevo">Registrar primer movimiento</Link>
          )}
        </section>
      )}
    </OperationalShell>
  );
}
