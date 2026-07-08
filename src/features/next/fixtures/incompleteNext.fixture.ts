import type { NextViewModel } from "../model";
import { incompleteHorizonEvidenceFixture } from "../evidence";

export const incompleteNextFixture = {
  rail: {
    items: ["Proximos 7 dias", "ARS", "Personal", "Informacion parcial"],
    state: "partial",
    wrap: "truncate",
  },
  banner: null,
  hero: {
    scenario: "incomplete",
    stateText: "La semana se entiende, pero no esta confirmada del todo.",
    value: "3.500",
    valuePrefix: "$",
    valueLabel: "Compromisos conocidos",
    inlineNote: "Falta cerrar un dato que puede cambiar esta lectura.",
    coverage: {
      title: "Cobertura conocida",
      value: 61,
      leftSummary: "Parcial",
      rightSummary: "Falta confirmar un cierre",
      state: "partial",
    },
  },
  evidence: incompleteHorizonEvidenceFixture,
  stability: {
    children: "Lo conocido orienta, pero todavia no alcanza para cerrar la cobertura de la semana.",
    container: "none",
    kind: "caution",
  },
  actions: {
    primary: "update",
    primaryLabel: "Revisar antes de decidir",
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
        value: "22.000",
        valuePrefix: "$",
      },
    ],
  },
  expected: {
    title: "Esperado en este horizonte",
    rows: [
      {
        kind: "with-status",
        label: "Servicios",
        supportingLabel: "Jueves · Debito agendado",
        status: "Esperado",
        value: "18.500",
        valuePrefix: "$",
      },
    ],
  },
  risk: {
    title: "Riesgo por revisar ahora",
    primaryLine: "Falta confirmar el cierre actual de la tarjeta principal.",
    causalLine: "Si ese importe cambia materialmente, puede modificar la tranquilidad de esta semana.",
    linkLabel: "Ver evidencia",
    linkHref: "#next-evidence",
    state: "partial",
  },
  information: {
    title: "Confianza de esta lectura",
    primaryLine: "La lectura es util, pero sigue parcial.",
    causalLine: "Hay hechos confirmados y una falta de dato material que todavia no permite cerrarla.",
    linkLabel: "Ver evidencia",
    linkHref: "#next-evidence",
    state: "partial",
  },
} satisfies NextViewModel;
