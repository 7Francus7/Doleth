import type { CloseViewModel } from "../model";
import { CLOSE_INFORMATION, CLOSE_RAIL, closeHref } from "./shared";

/**
 * Resumen final. Sin persistencia no se afirma que la revisión quedó guardada:
 * se dice que el resumen fue calculado con la información actual.
 */
export const summaryCloseFixture = {
  rail: CLOSE_RAIL,
  progressLabel: "Paso 7 de 7",
  stepNumber: 7,
  stepCount: 7,
  title: "Revisión completada",
  supportingLine: "Lo que quedó y lo que sigue",
  intro: "Lo que dejó julio y qué queda pendiente para el mes siguiente.",
  periods: null,
  blocks: [],
  warnings: [
    {
      id: "no-income",
      label: "Sin ingresos registrados",
      detail:
        "No encontramos ingresos en el período. Si cobraste y no lo registraste, el resultado del mes va a mostrar solo gastos.",
      severity: "review",
      actionLabel: "Registrar ingreso",
      actionHref: "/movimientos/nuevo",
    },
    {
      id: "overdue",
      label: "Pagos vencidos sin confirmar",
      detail:
        "1 pago del período venció y sigue pendiente. Puede ser que ya lo hayas pagado y falte registrarlo.",
      severity: "review",
      actionLabel: "Revisar próximos pagos",
      actionHref: "/proximo",
    },
  ],
  notice: null,
  summary: {
    title: "Revisión de julio completada",
    statement:
      "Resumen calculado con la información actual de Doleth. Esta revisión no se guarda ni bloquea el período: si registrás un movimiento con fecha de julio, las cifras cambian y podés volver a revisarlo.",
    rows: [
      {
        label: "Resultado neto",
        supportingLabel: "Ingresos − gastos de julio",
        value: "451.300",
        valuePrefix: "$",
      },
      {
        label: "Patrimonio final",
        supportingLabel: "Con el que terminó el período",
        value: "1.231.300",
        valuePrefix: "$",
      },
      {
        kind: "with-status",
        label: "Pagos pendientes del período",
        supportingLabel: "2 compromisos sin confirmar",
        status: "1 vencido",
        value: "70.200",
        valuePrefix: "$",
        state: "attention",
      },
      {
        kind: "with-status",
        label: "Información faltante",
        supportingLabel: "2 señales para revisar",
        status: "Siguen visibles después de la revisión",
        value: "2",
        valuePrefix: "",
      },
    ],
    actions: [
      { id: "reality", label: "Volver a Mi realidad", href: "/mi-realidad" },
      { id: "pending", label: "Revisar pendientes", href: "/proximo" },
      { id: "now", label: "Ir a Ahora", href: "/ahora" },
    ],
  },
  nav: {
    backHref: closeHref("resultado"),
    backLabel: "Volver a cuál fue el resultado",
    nextHref: null,
    nextLabel: null,
  },
  information: CLOSE_INFORMATION,
  empty: null,
} satisfies CloseViewModel;
