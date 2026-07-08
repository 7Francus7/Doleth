import type { NextViewModel } from "../model";
import { emptyHorizonEvidenceFixture } from "../evidence";

export const emptyNextFixture = {
  rail: {
    items: ["Proximos 7 dias", "ARS", "Personal", "Informacion completa"],
    state: "complete",
    wrap: "truncate",
  },
  banner: null,
  hero: {
    scenario: "stable",
    stateText: "No aparece nada material en este horizonte.",
    value: "0",
    valuePrefix: "$",
    valueLabel: "Por cubrir en 7 dias",
    inlineNote: "La ausencia de compromisos tambien es una respuesta valida.",
    coverage: {
      title: "Cobertura conocida",
      value: 0,
      leftSummary: "Sin hechos materiales",
      rightSummary: "Nada por cubrir",
      state: "empty",
    },
  },
  evidence: emptyHorizonEvidenceFixture,
  stability: {
    children: "No hay nada cercano que exija preparacion o corra tu tranquilidad.",
    container: "none",
    kind: "neutral",
  },
  actions: null,
  confirmed: null,
  expected: null,
  risk: null,
  information: {
    title: "Confianza de esta lectura",
    primaryLine: "No aparecen compromisos ni riesgos materiales en los proximos 7 dias.",
    causalLine: "La ausencia es consistente con el horizonte actual y no necesita compensarse con mas modulos.",
    linkLabel: "Ver evidencia",
    linkHref: "#next-evidence",
    state: "complete",
  },
} satisfies NextViewModel;
