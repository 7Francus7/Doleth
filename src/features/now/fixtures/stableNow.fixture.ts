import type { NowViewModel } from "../model";

export const stableNowFixture = {
  rail: {
    items: ["Actualizado hace 2 min", "ARS", "Personal", "Información completa"],
    state: "complete",
    wrap: "truncate",
  },
  hero: {
    scenario: "stable",
    stateText: "Hoy estás tranquilo.",
    value: "432.180",
    valuePrefix: "$",
    valueLabel: "Disponibles para usar",
    coverage: {
      title: "Próximos 7 días",
      value: 100,
      leftSummary: "Cobertura completa",
      rightSummary: "$57.820 cubiertos",
      state: "stable",
    },
  },
  stability: {
    children: "No hay riesgos inmediatos.",
    container: "none",
    kind: "neutral",
  },
  actions: {
    primary: "register",
    primaryLabel: "Registrar movimiento",
    secondaryActions: [
      { id: "pay", label: "Pagar" },
      { id: "move", label: "Mover" },
      { id: "update", label: "Actualizar" },
      { id: "evidence", label: "Evidencia" },
    ],
    state: "default",
  },
  position: {
    title: "Dónde está tu dinero",
    rows: [
      { label: "Líquido confirmado", value: "610.000", valuePrefix: "$" },
      { label: "Invertido", value: "1.240.000", valuePrefix: "$" },
      { label: "No disponible", value: "430.000", valuePrefix: "$" },
    ],
  },
  reserve: {
    title: "Dinero reservado",
    amount: "120.000",
    amountPrefix: "$",
    purposeLine: "Separado del disponible para compromisos y objetivos activos.",
    priority: "normal",
    state: "active",
  },
  information: {
    title: "Cómo sabemos esto",
    primaryLine: "La información está completa.",
    causalLine:
      "Incluye $610.000 líquidos, menos $120.000 reservados y $57.820 en pagos próximos.",
    linkLabel: "Ver evidencia",
    linkHref: "#evidence",
    state: "complete",
  },
} satisfies NowViewModel;
