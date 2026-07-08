import type { NextViewModel } from "../model";
import { attentionHorizonEvidenceFixture } from "../evidence";

export const attentionNextFixture = {
  rail: {
    items: ["Proximos 7 dias", "ARS", "Personal", "Informacion completa"],
    state: "complete",
    wrap: "truncate",
  },
  banner: {
    title: "El alquiler del jueves queda corto con la cobertura actual.",
    detail: "Conviene resolver esa prioridad antes de que entre el resto de la semana.",
    actionLabel: "Resolver primero esto",
  },
  hero: {
    scenario: "attention",
    tone: "state-raised",
    stateText: "Hay una prioridad que puede romper la tranquilidad.",
    value: "100.000",
    valuePrefix: "$",
    valueLabel: "Por cubrir en 7 dias",
    inlineNote: "La mayor presion esta concentrada en un solo vencimiento cercano.",
    coverage: {
      title: "Cobertura conocida",
      value: 38,
      leftSummary: "Falta cubrir",
      rightSummary: "$41.000 de tension",
      state: "atRisk",
    },
  },
  evidence: attentionHorizonEvidenceFixture,
  stability: {
    children: "La semana no esta desordenada, pero hay una prioridad que conviene resolver primero.",
    container: "none",
    kind: "attention",
  },
  actions: {
    primary: "resolve",
    primaryLabel: "Resolver primero esto",
    secondaryActions: [
      { id: "evidence", label: "Ver evidencia" },
      { id: "update", label: "Actualizar lectura" },
    ],
    state: "reduced",
  },
  confirmed: {
    title: "Confirmado en este horizonte",
    rows: [
      {
        kind: "with-status",
        label: "Cobro ya confirmado",
        supportingLabel: "Miercoles · Cuenta principal",
        status: "Confirmado",
        value: "24.000",
        valuePrefix: "$",
      },
    ],
  },
  expected: {
    title: "Esperado en este horizonte",
    rows: [
      {
        kind: "with-status",
        label: "Alquiler",
        supportingLabel: "Jueves · Transferencia programada",
        status: "Esperado",
        state: "attention",
        value: "96.000",
        valuePrefix: "$",
      },
      {
        kind: "with-status",
        label: "Pago minimo de tarjeta",
        supportingLabel: "Viernes · Tarjeta principal",
        status: "Esperado",
        value: "28.000",
        valuePrefix: "$",
      },
    ],
  },
  risk: null,
  information: {
    title: "Confianza de esta lectura",
    primaryLine: "La prioridad principal esta confirmada y se puede comprobar.",
    causalLine: "La tension no viene de una lista larga, sino de un vencimiento de alto peso.",
    linkLabel: "Ver evidencia",
    linkHref: "#next-evidence",
    state: "complete",
  },
} satisfies NextViewModel;
