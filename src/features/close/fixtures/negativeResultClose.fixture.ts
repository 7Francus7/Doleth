import type { CloseViewModel } from "../model";
import { CLOSE_INFORMATION, CLOSE_RAIL, closeHref } from "./shared";

/**
 * Resultado negativo. El período gastó más de lo que ingresó y se dice sin
 * culpabilizar: es una resta, no un juicio. También muestra el bloque de lo
 * registrado después del período.
 */
export const negativeResultCloseFixture = {
  rail: CLOSE_RAIL,
  progressLabel: "Paso 6 de 7",
  stepNumber: 6,
  stepCount: 7,
  title: "Cuál fue el resultado",
  supportingLine: "Reconciliación completa del período",
  intro: "Cómo se compone el resultado de junio y por qué reconcilia.",
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
          value: "920.000",
          valuePrefix: "$",
        },
        {
          kind: "with-status",
          label: "Ingresos",
          supportingLabel: "Movimientos vigentes del período",
          status: "Suman",
          value: "700.000",
          valuePrefix: "$",
        },
        {
          kind: "with-status",
          label: "Gastos",
          supportingLabel: "Movimientos vigentes del período",
          status: "Restan",
          value: "840.000",
          valuePrefix: "$",
        },
        {
          label: "Resultado neto",
          supportingLabel: "Ingresos − gastos",
          value: "140.000",
          valuePrefix: "-$",
          state: "attention",
        },
        {
          label: "Patrimonio final",
          supportingLabel: "Al último día del período",
          value: "780.000",
          valuePrefix: "$",
        },
      ],
      note: "La igualdad se cumple: $920.000 + $700.000 − $840.000 = $780.000. Las transferencias no participan porque no cambian el patrimonio.",
      noteKind: "stable",
    },
    {
      id: "after",
      title: "Lo registrado después del período",
      supportingLine: "Por qué el patrimonio de hoy no es el del cierre",
      rows: [
        {
          label: "Efecto posterior al período",
          supportingLabel: "Movimientos con fecha posterior al último día",
          value: "451.300",
          valuePrefix: "$",
        },
        {
          label: "Patrimonio de hoy",
          supportingLabel: "Patrimonio final del período + efecto posterior",
          value: "1.231.300",
          valuePrefix: "$",
        },
      ],
      note: "El cierre no congela nada: los movimientos posteriores siguen contando en tu patrimonio actual.",
      noteKind: "neutral",
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
