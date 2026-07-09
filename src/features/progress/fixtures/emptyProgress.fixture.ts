import type { ProgressViewModel } from "../model";

export const emptyProgressFixture = {
  rail: {
    items: ["Primer periodo en curso", "ARS", "Personal", "Sin cierre anterior"],
    state: "complete",
    wrap: "truncate",
  },
  banner: null,
  hero: {
    scenario: "new",
    stateText: "Tu trayectoria todavia no tiene un periodo anterior comparable.",
    valueLabel: "Todavia no hay un cierre anterior para comparar",
  },
  evidence: null,
  comparison: {
    title: "Comparacion de cierres",
    supportingLine: "Inicio del periodo y lectura actual de la misma base",
    rows: [
      {
        label: "Inicio del periodo",
        supportingLabel: "Primera lectura registrada",
        value: "647.500",
        valuePrefix: "$",
      },
      {
        label: "Lectura actual",
        supportingLabel: "Hoy - Misma base patrimonial",
        value: "647.500",
        valuePrefix: "$",
      },
    ],
    summary:
      "El primer periodo sigue en curso: la trayectoria empieza a existir cuando haya dos lecturas comparables.",
    summaryKind: "neutral",
  },
  stability: {
    children:
      "No hay direccion que leer todavia. La primera comparacion llega con el primer cierre de periodo.",
    container: "none",
    kind: "neutral",
  },
  actions: null,
  goals: null,
  missing: null,
  information: {
    title: "Evidencia de esta trayectoria",
    primaryLine:
      "No hay un periodo anterior cerrado que permita comprobar una trayectoria.",
    causalLine:
      "La ausencia de trayectoria tambien puede comprobarse: falta un segundo cierre comparable, no informacion perdida.",
    linkLabel: "Ver evidencia",
    linkHref: "#progress-evidence",
    state: "complete",
  },
} satisfies ProgressViewModel;
