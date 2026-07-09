import type { ChangesViewModel } from "../model";
import { emptyChangeEvidenceFixture } from "../evidence";

export const emptyChangesFixture = {
  rail: {
    items: ["Ultimos 7 dias", "ARS", "Personal", "Informacion completa"],
    state: "complete",
    wrap: "truncate",
  },
  banner: null,
  hero: {
    scenario: "stable",
    stateText: "Hoy no estas distinto por hechos materiales recientes.",
    value: "0",
    valuePrefix: "$",
    valueLabel: "Cambio neto visible",
    inlineNote: "La estabilidad reciente tambien es una respuesta valida.",
    coverage: {
      title: "Explicacion conocida",
      value: 0,
      leftSummary: "Sin cambios materiales",
      rightSummary: "Nada por explicar",
      state: "empty",
    },
  },
  evidence: emptyChangeEvidenceFixture,
  comparison: {
    title: "Comparacion breve",
    supportingLine: "Base previa y lectura actual",
    rows: [
      {
        label: "Base previa visible",
        supportingLabel: "Ultima lectura comparable",
        value: "320.000",
        valuePrefix: "$",
      },
      {
        label: "Lectura actual",
        supportingLabel: "Hoy - Sin variacion material",
        value: "320.000",
        valuePrefix: "$",
      },
    ],
    summary:
      "La base previa y la lectura actual no muestran una variacion reciente que cambie la situacion visible hoy.",
    summaryKind: "neutral",
    actionLabel: "Ver evidencia",
    actionHref: "#changes-evidence",
  },
  stability: {
    children: "No aparece un hecho reciente que hoy cambie materialmente la lectura actual.",
    container: "none",
    kind: "neutral",
  },
  actions: null,
  explained: null,
  missing: null,
  information: {
    title: "Evidencia de esta explicacion",
    primaryLine:
      "No aparecen hechos recientes con impacto material suficiente para alterar la lectura actual.",
    causalLine:
      "La ausencia de cambio relevante tambien puede comprobarse con la ventana observada y su cobertura.",
    linkLabel: "Ver evidencia",
    linkHref: "#changes-evidence",
    state: "complete",
  },
} satisfies ChangesViewModel;
