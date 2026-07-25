import type { CloseViewModel } from "../model";
import { CLOSE_INFORMATION, CLOSE_RAIL, closeHref } from "./shared";

/** Resultado positivo con la igualdad de reconciliación a la vista. */
export const positiveResultCloseFixture = {
  rail: CLOSE_RAIL,
  progressLabel: "Paso 6 de 7",
  stepNumber: 6,
  stepCount: 7,
  title: "Cuál fue el resultado",
  supportingLine: "Reconciliación completa del período",
  intro: "Cómo se compone el resultado de julio y por qué reconcilia.",
  periods: null,
  blocks: [
    {
      id: "reconciliation",
      title: "Resultado del período",
      supportingLine: "Patrimonio inicial + ingresos − gastos = patrimonio final",
      rows: [
        {
          label: "Patrimonio inicial",
          supportingLabel: "Al primer día del período",
          value: "780.000",
          valuePrefix: "$",
        },
        {
          kind: "with-status",
          label: "Ingresos",
          supportingLabel: "Movimientos vigentes del período",
          status: "Suman",
          value: "900.000",
          valuePrefix: "$",
        },
        {
          kind: "with-status",
          label: "Gastos",
          supportingLabel: "Movimientos vigentes del período",
          status: "Restan",
          value: "448.700",
          valuePrefix: "$",
        },
        {
          label: "Resultado neto",
          supportingLabel: "Ingresos − gastos",
          value: "451.300",
          valuePrefix: "$",
        },
        {
          label: "Patrimonio final",
          supportingLabel: "Al último día del período",
          value: "1.231.300",
          valuePrefix: "$",
        },
      ],
      note: "La igualdad se cumple: $780.000 + $900.000 − $448.700 = $1.231.300. Las transferencias no participan porque no cambian el patrimonio.",
      noteKind: "stable",
    },
  ],
  warnings: [],
  notice: null,
  summary: null,
  nav: {
    backHref: closeHref("informacion"),
    backLabel: "Volver a qué información falta",
    nextHref: closeHref("resumen"),
    nextLabel: "Completar la revisión",
  },
  information: CLOSE_INFORMATION,
  empty: null,
} satisfies CloseViewModel;
