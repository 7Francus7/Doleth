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
    valueLabel: "Lectura todavía no confirmada",
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
    children: "Podés orientarte, pero conviene revisar esto antes de decidir.",
    container: "none",
    kind: "caution",
  },
  actions: {
    primary: "update",
    primaryLabel: "Revisar antes de actuar",
    secondaryActions: [
      { id: "evidence", label: "Ver evidencia" },
      { id: "update", label: "Actualizar lectura" },
    ],
    state: "reduced",
  },
  position: {
    title: "Posición actual",
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
    title: "Confianza de esta lectura",
    primaryLine: "Cuenta principal sin confirmar.",
    causalLine: "El disponible puede variar cuando se actualice el saldo.",
    linkLabel: "Ver evidencia",
    linkHref: "#evidence",
    state: "partial",
  },
  reserve: {
    title: "Puede esperar hoy",
    amount: "120.000",
    amountPrefix: "$",
    purposeLine: "No hace falta tocarlo hasta confirmar el saldo principal.",
    priority: "normal",
    state: "active",
  },
} satisfies NowViewModel;
