import type { CloseViewModel } from "../model";

/**
 * Partes que todos los pasos comparten. Los fixtures solo declaran lo que
 * cambia de un paso a otro, así que un cambio de copy transversal no obliga a
 * tocar ocho archivos y no aparecen dos versiones de la misma frase.
 */
export const CLOSE_RAIL = {
  items: ["julio", "ARS", "Personal", "Período en curso"],
  state: "partial",
  wrap: "truncate",
} as const satisfies CloseViewModel["rail"];

export const CLOSE_INFORMATION = {
  title: "Qué hace y qué no hace esta revisión",
  primaryLine: "No modifica movimientos, no crea asientos y no bloquea el período.",
  causalLine:
    "Todas las cifras se calculan en el momento a partir del ledger. Como no se guarda, siempre refleja la información actual: si cargás un movimiento con fecha del período, la revisión cambia.",
  linkLabel: "Volver a Mi realidad",
  linkHref: "/mi-realidad",
  state: "partial",
} as const satisfies CloseViewModel["information"];

export const closeHref = (step: string): string =>
  `/mi-realidad/cierre?periodo=2026-07&paso=${step}`;
