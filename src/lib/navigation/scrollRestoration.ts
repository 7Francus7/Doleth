/**
 * Reglas puras de restauración de scroll para listas.
 *
 * La identidad de una lista es su ruta normalizada: mismos filtros ⇒ misma clave,
 * filtros distintos ⇒ claves distintas. Los parámetros se ordenan para que el orden
 * en que lleguen no genere dos claves para la misma lista.
 */
const PREFIX = "doleth:scroll:";

/** Ruta normalizada de una lista: parámetros vacíos fuera, resto ordenado. */
export function normalizeListPath(pathname: string, params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const key of Object.keys(params).sort()) {
    const value = params[key];
    if (value !== undefined && value !== "") search.set(key, value);
  }
  const query = search.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function scrollStorageKey(listPath: string): string {
  return `${PREFIX}${listPath}`;
}

/** Lee una posición guardada. Solo posiciones positivas y finitas sirven. */
export function parseSavedPosition(raw: string | null): number | null {
  if (raw === null) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value);
}

/**
 * ¿El documento ya creció lo suficiente como para que `target` sea alcanzable?
 * Si la lista quedó más corta, restaurar dejaría al usuario en una posición
 * distinta a la que tenía, así que preferimos no restaurar.
 */
export function hasEnoughHeight(scrollHeight: number, viewportHeight: number, target: number): boolean {
  return scrollHeight - viewportHeight >= target;
}

export interface NavigationIntent {
  button?: number;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  defaultPrevented?: boolean;
}

/**
 * ¿Este click navega dentro de la pestaña actual?
 * Abrir en pestaña o ventana nueva no cambia la posición de esta lista, así que
 * no debe pisar lo guardado.
 */
export function isRestorableNavigation(event: NavigationIntent): boolean {
  if (event.defaultPrevented) return false;
  if (event.button !== undefined && event.button !== 0) return false;
  return !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey);
}

/** Tolerancia de verificación: el layout puede mover la posición unos píxeles. */
export function isWithinTolerance(actual: number, expected: number, tolerance = 100): boolean {
  return Math.abs(actual - expected) <= tolerance;
}
