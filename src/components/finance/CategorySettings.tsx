"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  createCategoryAction,
  renameCategoryAction,
  setCategoryStatusAction,
  type FinanceActionState,
} from "../../app/actions/finance";
import {
  CATEGORY_NAME_MAX,
  FALLBACK_EXPENSE_SLUG,
  type CategoryCatalogEntry,
} from "../../lib/finance/categoryRules";
import { Button } from "../../design-system/primitives/Button";
import { StatusMessage } from "../../design-system/feedback";
import { SubmitButton } from "./SubmitButton";
import finance from "./finance.module.css";
import styles from "./CategorySettings.module.css";

const initialState: FinanceActionState = { ok: false, message: "" };

/**
 * Alta de una categoría propia.
 *
 * Dos campos y nada más: el nombre y si es gasto o ingreso. El tipo no se puede
 * deducir del nombre —"Alquiler" es gasto para quien alquila e ingreso para quien
 * alquila algo suyo— y elegirlo mal dejaría la categoría fuera del selector justo
 * cuando se la necesita.
 */
export function NewCategoryForm() {
  const [state, action] = useActionState(createCategoryAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!state.ok) return;
    formRef.current?.reset();
    // El foco vuelve al nombre: quien crea una categoría casi siempre crea dos.
    nameRef.current?.focus();
  }, [state.ok]);

  return (
    <form action={action} className={styles.newForm} ref={formRef}>
      <div className={styles.newRow}>
        <label className={finance.field}>
          <span>Nombre</span>
          <input
            autoComplete="off"
            maxLength={CATEGORY_NAME_MAX}
            name="name"
            placeholder="Obra social"
            ref={nameRef}
            required
          />
        </label>
        <label className={finance.field}>
          <span>Tipo</span>
          <select defaultValue="EXPENSE" name="kind" required>
            <option value="EXPENSE">Gasto</option>
            <option value="INCOME">Ingreso</option>
          </select>
        </label>
      </div>
      {state.message ? (
        <StatusMessage tone={state.ok ? "success" : "error"}>{state.message}</StatusMessage>
      ) : null}
      <SubmitButton pendingLabel="Creando…">Crear categoría</SubmitButton>
    </form>
  );
}

/**
 * Una fila del catálogo: renombrar y archivar.
 *
 * En reposo la fila es el nombre y lo que carga encima; el botón aparece cuando
 * el nombre cambió. Las dos acciones son formularios separados aunque compartan
 * la fila: un mismo formulario con dos botones dejaría que "Archivar" arrastre un
 * nombre a medio escribir, y archivar no conviene mezclarlo con nada.
 */
function CategoryRow({
  category,
  setStatus,
}: {
  category: CategoryCatalogEntry;
  setStatus: (formData: FormData) => void;
}) {
  const [renameState, rename] = useActionState(renameCategoryAction, initialState);
  const [draft, setDraft] = useState(category.name);

  const protectedCategory = category.slug === FALLBACK_EXPENSE_SLUG;
  const feedback = renameState.message ? renameState : null;
  // Una fila sin tocar no ofrece guardar nada. Trece categorías con dos botones
  // cada una convierten un catálogo en un tablero de controles, y la pantalla
  // pasa a pedir atención en vez de darla.
  const editing = draft.trim() !== category.name;

  return (
    <li className={`${styles.row} ${category.archived ? styles.archived : ""}`.trim()}>
      <div className={styles.controls}>
        <form action={rename} className={styles.nameForm} id={`rename-${category.id}`}>
          <input name="id" type="hidden" value={category.id} />
          <input
            aria-label={`Nombre de la categoría ${category.name}`}
            autoComplete="off"
            maxLength={CATEGORY_NAME_MAX}
            name="name"
            onChange={(event) => setDraft(event.target.value)}
            required
            value={draft}
          />
        </form>
        {/*
          Una acción por vez: mientras se está renombrando, archivar no es lo que
          esa persona está haciendo, y ofrecerlo al lado del nombre a medio
          escribir sólo invita a perderlo.
        */}
        {editing ? (
          <>
            <Button form={`rename-${category.id}`} kind="secondary" type="submit">
              Guardar
            </Button>
            <Button kind="ghost" onClick={() => setDraft(category.name)} type="button">
              Cancelar
            </Button>
          </>
        ) : protectedCategory ? null : (
          <form action={setStatus}>
            <input name="id" type="hidden" value={category.id} />
            <input name="archived" type="hidden" value={category.archived ? "false" : "true"} />
            <Button kind="ghost" type="submit">
              {category.archived ? "Reactivar" : "Archivar"}
            </Button>
          </form>
        )}
      </div>

      <p className={styles.meta}>{describeUse(category)}</p>
      {protectedCategory ? (
        <p className={styles.protected}>
          Es la categoría de respaldo: acá caen los gastos que se crean sin elegir una. Se puede renombrar, no archivar.
        </p>
      ) : null}
      {feedback ? <StatusMessage tone={feedback.ok ? "success" : "error"}>{feedback.message}</StatusMessage> : null}
    </li>
  );
}

/**
 * Qué carga esta categoría, en una línea.
 *
 * Se dice antes de archivar y no después: el número de movimientos es lo que
 * convierte "archivar esto" en una decisión informada.
 */
function describeUse(category: CategoryCatalogEntry): string {
  const parts: string[] = [];
  parts.push(
    category.movementCount === 0
      ? "Sin movimientos"
      : `${category.movementCount} ${category.movementCount === 1 ? "movimiento" : "movimientos"}`,
  );
  if (category.upcomingCount > 0) {
    parts.push(
      `${category.upcomingCount} ${category.upcomingCount === 1 ? "pago previsto" : "pagos previstos"}`,
    );
  }
  if (category.archived) parts.push("archivada: no aparece al cargar");
  return parts.join(" · ");
}

function CategoryGroup({
  title,
  intro,
  categories,
  setStatus,
}: {
  title: string;
  intro: string;
  categories: CategoryCatalogEntry[];
  setStatus: (formData: FormData) => void;
}) {
  if (categories.length === 0) return null;
  return (
    <section className={styles.group}>
      <h2 className={styles.groupTitle}>{title}</h2>
      <p className={styles.groupIntro}>{intro}</p>
      <ul className={styles.rows}>
        {categories.map((category) => (
          <CategoryRow category={category} key={category.id} setStatus={setStatus} />
        ))}
      </ul>
    </section>
  );
}

/**
 * El catálogo entero, agrupado por tipo.
 *
 * Archivar y reactivar viven acá y no en cada fila porque mueven la fila de
 * grupo: contada desde adentro, la confirmación se desmontaba junto con la fila
 * que la había pedido y el cambio quedaba sin decir. Desde el catálogo, el
 * mensaje sobrevive al salto y se lee arriba, donde empieza la pantalla.
 */
export function CategoryCatalog({ categories }: { categories: CategoryCatalogEntry[] }) {
  const [statusState, setStatus] = useActionState(setCategoryStatusAction, initialState);

  const expenses = categories.filter((category) => category.kind === "EXPENSE" && !category.archived);
  const incomes = categories.filter((category) => category.kind === "INCOME" && !category.archived);
  const archived = categories.filter((category) => category.archived);

  return (
    <>
      {statusState.message ? (
        <StatusMessage tone={statusState.ok ? "success" : "error"}>{statusState.message}</StatusMessage>
      ) : null}
      <CategoryGroup
        categories={expenses}
        intro="Aparecen al cargar un gasto y son las que desglosa «En qué se fue»."
        setStatus={setStatus}
        title="Gastos"
      />
      <CategoryGroup
        categories={incomes}
        intro="Aparecen al cargar un ingreso."
        setStatus={setStatus}
        title="Ingresos"
      />
      <CategoryGroup
        categories={archived}
        intro="Ya no se ofrecen al cargar. Lo que quedó cargado con ellas sigue igual: archivar no borra ni cambia un solo movimiento."
        setStatus={setStatus}
        title="Archivadas"
      />
    </>
  );
}
