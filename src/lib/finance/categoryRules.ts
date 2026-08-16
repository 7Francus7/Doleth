import { FALLBACK_EXPENSE_SLUG } from "./categories";

/**
 * Reglas de las categorías propias.
 *
 * Núcleo puro: no toca la base ni conoce a Prisma. Acá viven las decisiones que
 * no dependen del almacenamiento —cómo se llama una categoría, qué slug le toca,
 * cuándo se puede archivar— para que las acciones sólo hagan el trabajo de leer
 * y escribir, y para que estas reglas se puedan probar sin una base.
 */

export const CATEGORY_KINDS = ["INCOME", "EXPENSE"] as const;

export type CategoryKind = (typeof CATEGORY_KINDS)[number];

export function isCategoryKind(value: string): value is CategoryKind {
  return (CATEGORY_KINDS as readonly string[]).includes(value);
}

export const CATEGORY_KIND_LABELS: Record<CategoryKind, string> = {
  INCOME: "Ingreso",
  EXPENSE: "Gasto",
};

export const CATEGORY_NAME_MIN = 2;
export const CATEGORY_NAME_MAX = 40;

/**
 * Limpia el nombre escrito sin cambiar lo que la persona quiso decir.
 *
 * Colapsa espacios y recorta las puntas. No cambia mayúsculas: "IVA" y "Padres"
 * son de quien las escribe, y capitalizar por nuestra cuenta convertiría una en
 * "Iva". Los caracteres de control se van porque no se ven pero rompen listas y
 * exportaciones.
 */
export function normalizeCategoryName(input: string): string {
  return input.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
}

/** ¿El nombre alcanza para ser una categoría? Devuelve el motivo, o `null` si está bien. */
export function categoryNameProblem(name: string): string | null {
  if (name.length < CATEGORY_NAME_MIN) return "El nombre necesita al menos dos caracteres.";
  if (name.length > CATEGORY_NAME_MAX) return `El nombre no puede pasar de ${CATEGORY_NAME_MAX} caracteres.`;
  // Un nombre que es sólo puntuación deja una fila que no se puede nombrar en
  // voz alta ni buscar en una lista.
  if (!/\p{Letter}|\p{Number}/u.test(name)) return "El nombre necesita al menos una letra o un número.";
  return null;
}

/**
 * Slug estable a partir del nombre.
 *
 * El slug no se muestra: es la identidad técnica que usan la categoría de
 * respaldo, el seed y las exportaciones. Se deriva del nombre una sola vez, al
 * crearla, y **no** se recalcula al renombrar: si "Comida" pasa a llamarse
 * "Supermercado", el slug sigue siendo el mismo y ninguna referencia se rompe.
 *
 * Los acentos se pliegan a su letra base para que "Pádel" y "Padel" no convivan
 * como dos slugs distintos que la persona lee igual.
 */
export function slugifyCategoryName(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  // Un nombre entero en otro alfabeto —"日常"— no deja ni una letra latina. En vez
  // de rechazarlo, se le da un slug propio: el nombre visible se guarda igual.
  return base || "categoria";
}

/**
 * Slug libre dentro del catálogo de una persona.
 *
 * `(userId, slug)` es único en la base. Dos categorías que se llaman parecido
 * —"Auto" y "auto"— son un caso normal, no un error que valga la pena mostrarle
 * a alguien: la segunda recibe `auto-2` y sigue su camino.
 */
export function uniqueCategorySlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const candidate = `${base}-${suffix}`;
    if (!used.has(candidate)) return candidate;
  }
  // Mil categorías con el mismo nombre no es un catálogo: es un error de otra
  // parte. Un sufijo aleatorio evita el bucle infinito sin fallar la operación.
  return `${base}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * ¿Este nombre repite otro que ya existe?
 *
 * Compara plegando acentos y mayúsculas, que es como lo lee una persona: tener
 * "Comida" y "comida" en el mismo selector no es flexibilidad, es no saber cuál
 * elegir.
 */
export function isDuplicateCategoryName(name: string, existing: Iterable<string>): boolean {
  const key = comparableName(name);
  for (const other of existing) {
    if (comparableName(other) === key) return true;
  }
  return false;
}

const comparableName = (name: string) =>
  name.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export interface ArchivableCategory {
  slug: string;
  archivedAt: Date | null;
}

/**
 * Una categoría tal como se lee en pantalla, con lo que carga encima.
 *
 * Vive en el núcleo puro y no en la capa de datos porque la pantalla que la
 * muestra corre en el cliente: un tipo que viaja desde un módulo `server-only`
 * ata la vista a Prisma sin necesidad.
 */
export interface CategoryCatalogEntry {
  id: string;
  slug: string;
  name: string;
  kind: CategoryKind;
  archived: boolean;
  /** Movimientos vigentes que la usan. Los anulados no cuentan: no están en ningún total. */
  movementCount: number;
  /** Pagos previstos pendientes que caerían en ella al confirmarse. */
  upcomingCount: number;
}

/**
 * ¿Se puede archivar esta categoría? Devuelve el motivo del "no", o `null`.
 *
 * La única que no se puede archivar es la de respaldo. No es una categoría más:
 * es adonde caen los gastos que se crean sin que nadie elija —confirmar un pago
 * previsto sin categoría, importar un resumen—. Archivarla dejaría esas
 * operaciones sin destino y fallando por un motivo que nadie relacionaría con
 * haber archivado algo semanas antes.
 */
export function archiveCategoryProblem(category: ArchivableCategory): string | null {
  if (category.slug === FALLBACK_EXPENSE_SLUG) {
    return "«Otros gastos» es la categoría de respaldo: no se puede archivar. Podés renombrarla.";
  }
  if (category.archivedAt) return "Esta categoría ya está archivada.";
  return null;
}

export { FALLBACK_EXPENSE_SLUG };
