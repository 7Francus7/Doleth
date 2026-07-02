import { incompleteAvailableEvidenceFixture } from "../evidence/fixtures";
import type { NowViewModel } from "../model";

export const incompleteNowFixture = {
  rail: {
    items: ["Última actualización hace 19 h", "ARS", "Personal", "Información parcial"],
    state: "partial",
    wrap: "truncate",
  },
  banner: null,
  hero: {
    scenario: "incomplete",
    stateText: "Hace falta confirmar saldo principal",
    value: "432.180",
    valuePrefix: "$",
    valueLabel: "No confirmado",
    inlineNote: "Último valor hace 19 h",
    coverage: {
      title: "Cobertura estimada",
      value: 64,
      leftSummary: "Datos parciales",
      rightSummary: "$57.820 conocidos",
      state: "partial",
    },
  },
  evidence: incompleteAvailableEvidenceFixture,
  stability: {
    children: "Podés orientarte, pero no cerrar una decisión grande todavía.",
    container: "none",
    kind: "caution",
  },
  actions: {
    primary: "update",
    primaryLabel: "Actualizar saldo",
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
      {
        label: "Saldo principal",
        supportingLabel: "Último valor hace 19 h",
        value: "610.000",
        valuePrefix: "$",
        state: "partial",
      },
      { label: "Invertido", value: "1.240.000", valuePrefix: "$" },
      { label: "No disponible", value: "430.000", valuePrefix: "$" },
    ],
  },
  information: {
    title: "Estado de la información",
    primaryLine: "Cuenta principal sin confirmar.",
    causalLine: "El disponible puede variar cuando se actualice el saldo.",
    linkLabel: "Ver evidencia",
    linkHref: "#evidence",
    state: "partial",
  },
  reserve: {
    title: "Dinero reservado",
    amount: "120.000",
    amountPrefix: "$",
    purposeLine: "Separado del disponible para compromisos y objetivos activos.",
    priority: "normal",
    state: "active",
  },
} satisfies NowViewModel;
