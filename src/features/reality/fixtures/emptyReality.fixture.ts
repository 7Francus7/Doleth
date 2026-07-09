import type { RealityViewModel } from "../model";

export const emptyRealityFixture = {
  rail: {
    items: ["Corte de hoy", "ARS", "Personal", "Sin objetos registrados"],
    state: "complete",
    wrap: "truncate",
  },
  banner: null,
  hero: {
    scenario: "new",
    stateText: "Tu situacion todavia no tiene composicion visible en Doleth.",
    valueLabel: "Todavia no hay objetos registrados en tu estructura",
  },
  evidence: null,
  composition: {
    title: "Composicion por dominio",
    supportingLine: "Lo que aporta y lo que compromete valor",
    rows: [
      {
        label: "Lo que aporta valor",
        supportingLabel: "Sin cuentas, inversiones ni reservas",
        value: "0",
        valuePrefix: "$",
      },
      {
        label: "Lo que compromete valor",
        supportingLabel: "Sin tarjetas ni deudas",
        value: "0",
        valuePrefix: "$",
      },
    ],
    summary:
      "Todavia no hay objetos que aporten o comprometan valor. El punto de partida tambien es una estructura valida.",
    summaryKind: "neutral",
  },
  stability: {
    children:
      "No hay composicion que comprobar hasta registrar el primer objeto de tu situacion.",
    container: "none",
    kind: "neutral",
  },
  actions: null,
  domains: null,
  missing: null,
  information: {
    title: "Evidencia de esta composicion",
    primaryLine:
      "No hay objetos estructurales registrados que compongan una base patrimonial visible.",
    causalLine:
      "La ausencia de estructura tambien puede comprobarse: no hay dominios con valores que reconciliar.",
    linkLabel: "Ver evidencia",
    linkHref: "#reality-evidence",
    state: "complete",
  },
} satisfies RealityViewModel;
