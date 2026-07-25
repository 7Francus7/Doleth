import type { CloseViewModel } from "../model";
import { CLOSE_INFORMATION, CLOSE_RAIL, closeHref } from "./shared";

/** Paso 1: elegir el período. Dos opciones civiles, ninguna arbitraria. */
export const periodCloseFixture = {
  rail: CLOSE_RAIL,
  progressLabel: "Paso 1 de 7",
  stepNumber: 1,
  stepCount: 7,
  title: "Qué período vas a revisar",
  supportingLine: "Mes en curso o mes anterior",
  intro:
    "Vas a revisar julio. Esta revisión no cierra el período ni bloquea movimientos: es una lectura guiada de lo que ya registraste.",
  periods: [
    {
      month: "2026-07",
      label: "julio",
      detail: "Del 1 de julio al 31 de julio · todavía en curso",
      href: "/mi-realidad/cierre?periodo=2026-07&paso=periodo",
      selected: true,
    },
    {
      month: "2026-06",
      label: "junio",
      detail: "Del 1 de junio al 30 de junio · mes cerrado en el calendario",
      href: "/mi-realidad/cierre?periodo=2026-06&paso=periodo",
      selected: false,
    },
  ],
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
  empty: null,
} satisfies CloseViewModel;
