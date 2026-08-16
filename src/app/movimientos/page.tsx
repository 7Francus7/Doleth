import Link from "next/link";
import { OperationalShell } from "../../components/finance/OperationalShell";
import { MovementsExplorer } from "../../features/movements/MovementsExplorer";
import { parseMovementQuery } from "../../features/movements/model";
import { requireOnboardedUser } from "../../lib/auth/guards";
import { parseAmountInput } from "../../lib/finance/amount";
import { getMovements } from "../../lib/finance/data";
import { todayInArgentina } from "../../lib/finance/domain";
import styles from "../../features/movements/movements.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Movimientos" };

const validAmount = (value: string | undefined) => {
  if (!value) return undefined;
  const reading = parseAmountInput(value);
  return reading.error === null && reading.cents !== null ? reading.cents : undefined;
};

export default async function MovementsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireOnboardedUser("/movimientos");
  const today = todayInArgentina();
  const currentMonth = today.slice(0, 7);
  const query = parseMovementQuery(await searchParams, today);
  const minAmountCents = validAmount(query.min);
  const maxAmountCents = validAmount(query.max);
  const data = await getMovements(user.id, {
    month: query.month,
    ...(query.type ? { type: query.type } : {}),
    ...(query.accountId ? { accountId: query.accountId } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.q ? { search: query.q } : {}),
    ...(minAmountCents !== undefined ? { minAmountCents } : {}),
    ...(maxAmountCents !== undefined ? { maxAmountCents } : {}),
    page: query.page,
  });

  return <OperationalShell
    actions={<Link className={styles.emptyAction} href="/movimientos/nuevo">+ Registrar</Link>}
    eyebrow="Registro auditable"
    intro="Encontrá cada gasto, ingreso y transferencia. Los anulados permanecen visibles, sin afectar saldos."
    title="Movimientos"
    wide
  >
    <MovementsExplorer
      accounts={data.accounts}
      categories={data.categories}
      currentMonth={currentMonth}
      hasAnyMovements={data.totalMovements > 0}
      hasNext={data.hasNext}
      hasPrevious={data.hasPrevious}
      movements={data.movements}
      query={query}
      today={today}
    />
  </OperationalShell>;
}
