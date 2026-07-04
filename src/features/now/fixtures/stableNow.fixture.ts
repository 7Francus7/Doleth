import type { NowViewModel } from "../model";
import { availableEvidenceFixture } from "../evidence/fixtures";

export const stableNowFixture = {
  rail: {
    items: ["Actualizado hace 2 min", "ARS", "Personal", "Información completa"],
    state: "complete",
    wrap: "truncate",
  },
  banner: null,
  hero: {
    scenario: "stable",
    stateText: "Hoy estás tranquilo.",
    value: "432.180",
    valuePrefix: "$",
    valueLabel: "Disponible para hoy",
    coverage: {
      title: "Próximos 7 días",
      value: 100,
      leftSummary: "Cobertura completa",
      rightSummary: "$57.820 cubiertos",
      state: "stable",
    },
  },
  evidence: availableEvidenceFixture,
  stability: {
    children: "No hay nada urgente. Lo importante ya está bajo control.",
    container: "none",
    kind: "neutral",
  },
  actions: {
    primary: "resolve",
    primaryLabel: "Ver qué hacer hoy",
    secondaryActions: [
      { id: "evidence", label: "Ver evidencia" },
      { id: "update", label: "Actualizar lectura" },
    ],
    state: "reduced",
  },
  position: {
    title: "Posición actual",
    rows: [
      { label: "Líquido confirmado", value: "610.000", valuePrefix: "$" },
      { label: "Invertido", value: "1.240.000", valuePrefix: "$" },
      { label: "No disponible", value: "430.000", valuePrefix: "$" },
    ],
  },
  reserve: {
    title: "Puede esperar hoy",
    amount: "120.000",
    amountPrefix: "$",
    purposeLine: "Ya está separado para compromisos y objetivos activos.",
    priority: "normal",
    state: "active",
  },
  information: {
    title: "Confianza de esta lectura",
    primaryLine: "La información está completa.",
    causalLine: "Disponible, cobertura y reservas usan datos vigentes de hoy.",
    linkLabel: "Ver evidencia",
    linkHref: "#evidence",
    state: "complete",
  },
} satisfies NowViewModel;
