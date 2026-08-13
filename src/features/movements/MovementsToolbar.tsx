"use client";

import Link from "next/link";
import { useRef, useState, type KeyboardEvent } from "react";
import { BottomSheet } from "../../design-system/composites/BottomSheet";
import { movementPath, movementTypeLabel, type MovementQuery, type MovementType } from "./model";
import styles from "./movements.module.css";

interface Option { id: string; name: string }

export function MovementsToolbar({ query, accounts, categories, activeCount }: {
  query: MovementQuery;
  accounts: Option[];
  categories: Option[];
  activeCount: number;
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const searchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Escape" || !event.currentTarget.value) return;
    event.currentTarget.value = "";
    event.currentTarget.form?.requestSubmit();
  };

  const filterFields = (prefix: string) => <>
    <label className={styles.filterField} htmlFor={`${prefix}-month`}><span>Período</span><input defaultValue={query.month} id={`${prefix}-month`} name="month" type="month" /></label>
    <label className={styles.filterField} htmlFor={`${prefix}-account`}><span>Cuenta</span><select defaultValue={query.accountId ?? ""} id={`${prefix}-account`} name="accountId"><option value="">Todas</option>{accounts.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>
    <label className={styles.filterField} htmlFor={`${prefix}-category`}><span>Categoría</span><select defaultValue={query.categoryId ?? ""} id={`${prefix}-category`} name="categoryId"><option value="">Todas</option>{categories.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>
    <div className={styles.amountRange}>
      <label className={styles.filterField} htmlFor={`${prefix}-min`}><span>Importe mínimo</span><input defaultValue={query.min ?? ""} id={`${prefix}-min`} inputMode="decimal" name="min" placeholder="0" /></label>
      <label className={styles.filterField} htmlFor={`${prefix}-max`}><span>Importe máximo</span><input defaultValue={query.max ?? ""} id={`${prefix}-max`} inputMode="decimal" name="max" placeholder="Sin límite" /></label>
    </div>
    {query.q ? <input name="q" type="hidden" value={query.q} /> : null}
    {query.type ? <input name="type" type="hidden" value={query.type} /> : null}
  </>;

  return <section aria-label="Buscar y filtrar movimientos" className={styles.toolbar}>
    <form action="/movimientos" className={styles.searchForm}>
      <label htmlFor="movement-search">Buscar movimientos</label>
      <div>
        <input defaultValue={query.q ?? ""} enterKeyHint="search" id="movement-search" name="q" onKeyDown={searchKeyDown} placeholder="Descripción, categoría, cuenta o importe" type="search" />
        <button type="submit">Buscar</button>
      </div>
      <input name="month" type="hidden" value={query.month} />
      {query.type ? <input name="type" type="hidden" value={query.type} /> : null}
      {query.accountId ? <input name="accountId" type="hidden" value={query.accountId} /> : null}
      {query.categoryId ? <input name="categoryId" type="hidden" value={query.categoryId} /> : null}
      {query.min ? <input name="min" type="hidden" value={query.min} /> : null}
      {query.max ? <input name="max" type="hidden" value={query.max} /> : null}
    </form>

    <nav aria-label="Tipo de movimiento" className={styles.typeTabs}>
      <Link aria-current={!query.type ? "page" : undefined} href={movementPath(query, { type: undefined, page: 1 })}>Todos</Link>
      {(Object.entries(movementTypeLabel) as [MovementType, string][]).map(([type, label]) => <Link aria-current={query.type === type ? "page" : undefined} href={movementPath(query, { type, page: 1 })} key={type}>{label === "Transferencia" ? "Transferencias" : `${label}s`}</Link>)}
    </nav>

    <button className={styles.mobileFilterTrigger} onClick={() => setFiltersOpen(true)} ref={triggerRef} type="button">Filtros{activeCount ? ` · ${activeCount}` : ""}</button>
    <form action="/movimientos" className={styles.desktopFilters}>
      {filterFields("desktop")}
      <button className={styles.applyFilters} type="submit">Aplicar</button>
    </form>

    <BottomSheet height="full" onOpenChange={setFiltersOpen} open={filtersOpen} returnFocusRef={triggerRef} subtitle={activeCount ? `${activeCount} activos` : "Refiná el historial"} title="Filtros">
      <form action="/movimientos" className={styles.sheetFilters}>
        {filterFields("sheet")}
        <div className={styles.sheetActions}><Link href="/movimientos" onClick={() => setFiltersOpen(false)}>Limpiar</Link><button type="submit">Ver movimientos</button></div>
      </form>
    </BottomSheet>
  </section>;
}
