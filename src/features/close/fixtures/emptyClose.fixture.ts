import type { CloseViewModel } from "../model";
import { CLOSE_INFORMATION, CLOSE_RAIL, closeHref } from "./shared";

/** Sin cuentas no hay período que revisar: una sola salida, sin cifras. */
export const emptyCloseFixture = {
  rail: CLOSE_RAIL,
  progressLabel: "Paso 1 de 7",
  stepNumber: 1,
  stepCount: 7,
  title: "Qué período vas a revisar",
  supportingLine: "Mes en curso o mes anterior",
  intro:
    "Vas a revisar julio. Esta revisión no cierra el período ni bloquea movimientos: es una lectura guiada de lo que ya registraste.",
  periods: null,
  blocks: [],
  warnings: [],
  notice: null,
  summary: null,
  nav: {
    backHref: "/mi-realidad",
    backLabel: "Volver a Mi realidad",
    nextHref: closeHref("cuentas"),
    nextLabel: "Continuar",
  },
  information: CLOSE_INFORMATION,
  empty: {
    title: "Todavía no hay nada que revisar",
    description:
      "Sin cuentas registradas no hay período que cerrar: no hay saldo inicial, ni movimientos, ni resultado.",
    actionLabel: "Crear cuenta",
    actionHref: "/cuentas/nueva",
  },
} satisfies CloseViewModel;
