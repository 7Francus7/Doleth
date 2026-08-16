import Link from "next/link";
import { RestorableList } from "../../components/finance/RestorableList";
import { SensitiveAmount } from "../../components/privacy/AmountPrivacy";
import { EmptyState } from "../../design-system/feedback";
import {
  activeMovementFilterCount,
  groupMovementsByDay,
  movementPath,
  movementTypeLabel,
  signedMovementAmount,
  type MovementListItem,
  type MovementQuery,
} from "./model";
import { MovementsToolbar } from "./MovementsToolbar";
import styles from "./movements.module.css";

interface Option { id: string; name: string }

export interface MovementsExplorerProps {
  today: string;
  currentMonth: string;
  query: MovementQuery;
  movements: MovementListItem[];
  accounts: Option[];
  categories: Option[];
  hasPrevious: boolean;
  hasNext: boolean;
  hasAnyMovements: boolean;
}

const monthLabel = (month: string) => new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00.000Z`));

export function MovementsExplorer(props: MovementsExplorerProps) {
  const { today, currentMonth, query, movements, accounts, categories, hasPrevious, hasNext, hasAnyMovements } = props;
  const activeCount = activeMovementFilterCount(query, currentMonth);
  const listPath = movementPath(query);
  const groups = groupMovementsByDay(movements, today);
  const account = accounts.find((option) => option.id === query.accountId);
  const category = categories.find((option) => option.id === query.categoryId);
  const chips = [
    ...(query.month !== currentMonth ? [{ label: monthLabel(query.month), href: movementPath(query, { month: currentMonth, page: 1 }) }] : []),
    ...(query.type ? [{ label: movementTypeLabel[query.type], href: movementPath(query, { type: undefined, page: 1 }) }] : []),
    ...(account ? [{ label: account.name, href: movementPath(query, { accountId: undefined, page: 1 }) }] : []),
    ...(category ? [{ label: category.name, href: movementPath(query, { categoryId: undefined, page: 1 }) }] : []),
    ...(query.q ? [{ label: `“${query.q}”`, href: movementPath(query, { q: undefined, page: 1 }) }] : []),
    ...(query.min ? [{ label: `Desde $${query.min}`, href: movementPath(query, { min: undefined, page: 1 }) }] : []),
    ...(query.max ? [{ label: `Hasta $${query.max}`, href: movementPath(query, { max: undefined, page: 1 }) }] : []),
  ];

  return <>
    <MovementsToolbar accounts={accounts} activeCount={activeCount} categories={categories} query={query} />
    <div aria-label="Filtros activos" className={styles.activeFilters}>
      <p>{movements.length} movimientos{hasNext || hasPrevious ? " en esta página" : ""} · {monthLabel(query.month)}</p>
      {chips.length ? <div>{chips.map((chip) => <Link aria-label={`Quitar filtro ${chip.label}`} href={chip.href} key={chip.label}>{chip.label}<span aria-hidden="true"> ×</span></Link>)}<Link className={styles.clearAll} href="/movimientos">Limpiar todo</Link></div> : null}
    </div>
    <p aria-live="polite" className={styles.srOnly}>{movements.length} movimientos encontrados.</p>

    {groups.length ? <RestorableList className={styles.history} restorationKey={listPath}>
      {groups.map((group) => <section aria-labelledby={`day-${group.day}`} className={styles.dayGroup} key={group.day}>
        <h2 id={`day-${group.day}`}>{group.label}</h2>
        <div>{group.movements.map((movement) => {
          const route = movement.type === "TRANSFER"
            ? `${movement.sourceAccountName} → ${movement.destinationAccountName ?? "Destino"}`
            : movement.sourceAccountName;
          return <Link className={styles.movementRow} data-type={movement.type} href={`/movimientos/${movement.id}?volver=${encodeURIComponent(listPath)}`} key={movement.id}>
            <span className={styles.rowCopy}>
              <span className={styles.rowTitle}><strong>{movement.description}</strong>{movement.categoryName && movement.categoryName !== movement.description ? <small>/ {movement.categoryName}</small> : null}</span>
              <span className={styles.rowMeta}>{route} · {movementTypeLabel[movement.type]}</span>
              {movement.voided || movement.corrected ? <span className={styles.rowState}>{movement.voided ? "Anulado" : "Corregido"}</span> : null}
            </span>
            <span className={styles.rowAmount}><SensitiveAmount>{signedMovementAmount(movement)}</SensitiveAmount></span>
          </Link>;
        })}</div>
      </section>)}
    </RestorableList> : <EmptyState
      description={query.q ? "Probá otra descripción, categoría, cuenta o importe." : activeCount ? "Cambiá o limpiá los filtros para ampliar el historial." : hasAnyMovements ? `No registraste movimientos en ${monthLabel(query.month)}.` : "Registrá el primer movimiento para empezar tu historial auditable."}
      primaryAction={query.q || activeCount ? <Link className={styles.emptyAction} href="/movimientos">Limpiar búsqueda y filtros</Link> : <Link className={styles.emptyAction} href="/movimientos/nuevo">+ Registrar</Link>}
      title={query.q ? `Sin resultados para “${query.q}”` : activeCount ? "No hay movimientos con estos filtros" : hasAnyMovements ? "Período sin movimientos" : "No hay movimientos"}
    />}

    {hasPrevious || hasNext ? <nav aria-label="Páginas del historial" className={styles.pagination}>
      {hasPrevious ? <Link href={movementPath(query, { page: query.page - 1 })}>← Anteriores</Link> : <span />}
      <span>Página {query.page}</span>
      {hasNext ? <Link href={movementPath(query, { page: query.page + 1 })}>Siguientes →</Link> : <span />}
    </nav> : null}
  </>;
}
