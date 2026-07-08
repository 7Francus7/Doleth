import type { NextViewModel } from "../model";
import { stableHorizonEvidenceFixture } from "../evidence";

export const stableNextFixture = {
  rail: {
    items: ["Proximos 7 dias", "ARS", "Personal", "Informacion completa"],
    state: "complete",
    wrap: "truncate",
  },
  banner: null,
  hero: {
    scenario: "stable",
    stateText: "La semana esta bajo control.",
    value: "39.820",
    valuePrefix: "$",
    valueLabel: "Por cubrir en 7 dias",
    inlineNote: "Incluye compromisos y cobros ya visibles en este horizonte.",
    coverage: {
      title: "Cobertura conocida",
      value: 100,
      leftSummary: "Cubierto",
      rightSummary: "$39.820 resueltos",
      state: "stable",
    },
  },
  evidence: stableHorizonEvidenceFixture,
  stability: {
    children: "Lo que viene esta semana ya tiene cobertura suficiente.",
    container: "none",
    kind: "stable",
  },
  actions: {
    primary: "resolve",
    primaryLabel: "Preparar lo siguiente",
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
        label: "Cobro de cliente",
        supportingLabel: "Viernes · Cuenta principal",
        status: "Confirmado",
        value: "18.000",
        valuePrefix: "$",
      },
    ],
  },
  expected: {
    title: "Esperado en este horizonte",
    rows: [
      {
        kind: "with-status",
        label: "Pago de tarjeta",
        supportingLabel: "Jueves · Visa cierre actual",
        status: "Esperado",
        value: "31.500",
        valuePrefix: "$",
      },
      {
        kind: "with-status",
        label: "Cuota automatica",
        supportingLabel: "Sabado · Prestamo personal",
        status: "Esperado",
        value: "26.320",
        valuePrefix: "$",
      },
    ],
  },
  risk: null,
  information: {
    title: "Confianza de esta lectura",
    primaryLine: "La semana esta sostenida por hechos ya conocidos.",
    causalLine: "Fechas, montos y cobertura usan informacion vigente para este horizonte.",
    linkLabel: "Ver evidencia",
    linkHref: "#next-evidence",
    state: "complete",
  },
} satisfies NextViewModel;
