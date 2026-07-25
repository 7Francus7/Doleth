import type { CloseViewModel } from "../model";
import { CLOSE_INFORMATION, CLOSE_RAIL, closeHref } from "./shared";

/** Paso de compromisos con un pago vencido: no bloquea, se declara. */
export const overdueCloseFixture = {
  rail: CLOSE_RAIL,
  progressLabel: "Paso 4 de 7",
  stepNumber: 4,
  stepCount: 7,
  title: "Qué pagos tenía el período",
  supportingLine: "Pagados, pendientes, vencidos y fuera del período",
  intro: "Los pagos con vencimiento en julio y los que quedan por delante.",
  periods: null,
  blocks: [
    {
      id: "payments",
      title: "Compromisos del período",
      supportingLine: "Vencimientos entre el 1 de julio y el 31 de julio",
      rows: [
        {
          kind: "with-status",
          label: "Pagados",
          supportingLabel: "2 pagos confirmados del período",
          status: "Ya son movimientos registrados",
          value: "71.200",
          valuePrefix: "$",
        },
        {
          kind: "with-status",
          label: "Vencidos",
          supportingLabel: "1 pago con fecha pasada",
          status: "Sin confirmar",
          value: "41.800",
          valuePrefix: "$",
          state: "attention",
        },
        {
          kind: "with-status",
          label: "Pendientes del período",
          supportingLabel: "1 pago con fecha todavía por delante",
          status: "No se resta del resultado",
          value: "28.400",
          valuePrefix: "$",
        },
        {
          kind: "with-status",
          label: "Fuera del período",
          supportingLabel: "2 pagos pendientes con vencimiento posterior",
          status: "No bloquea esta revisión",
          value: "127.200",
          valuePrefix: "$",
        },
      ],
      note: "Los pagos pendientes no se restan del resultado: todavía no ocurrieron. Los pagados ya son movimientos y están contados una sola vez.",
      noteKind: "attention",
      actionLabel: "Ver Próximo",
      actionHref: "/proximo",
    },
  ],
  warnings: [],
  notice: null,
  summary: null,
  nav: {
    backHref: closeHref("movimientos"),
    backLabel: "Volver a qué se registró en el mes",
    nextHref: closeHref("informacion"),
    nextLabel: "Continuar",
  },
  information: CLOSE_INFORMATION,
  empty: null,
} satisfies CloseViewModel;
