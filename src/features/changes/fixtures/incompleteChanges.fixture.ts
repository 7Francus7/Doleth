import type { ChangesViewModel } from "../model";
import { incompleteChangeEvidenceFixture } from "../evidence";

export const incompleteChangesFixture = {
  rail: {
    items: ["Ultimos 7 dias", "ARS", "Personal", "Informacion parcial"],
    state: "partial",
    wrap: "truncate",
  },
  banner: null,
  hero: {
    scenario: "incomplete",
    stateText: "Hoy estas distinto, pero la explicacion no cierra del todo.",
    value: "18.200",
    valuePrefix: "$",
    valueLabel: "Cambio neto conocido",
    inlineNote: "Dos hechos ya explican la mayor parte; falta cerrar uno.",
    coverage: {
      title: "Explicacion conocida",
      value: 63,
      leftSummary: "Parcial",
      rightSummary: "Falta confirmar un cobro",
      state: "partial",
    },
  },
  evidence: incompleteChangeEvidenceFixture,
  comparison: {
    title: "Comparacion breve",
    supportingLine: "Base previa y lectura actual",
    rows: [
      {
        label: "Base previa visible",
        supportingLabel: "Ultima lectura comparable",
        value: "267.500",
        valuePrefix: "$",
      },
      {
        kind: "with-status",
        label: "Lectura actual",
        supportingLabel: "Hoy - Cuenta principal",
        status: "Falta cerrar un hecho",
        state: "partial",
        value: "285.700",
        valuePrefix: "$",
      },
    ],
    summary:
      "Hoy estas algo mas arriba porque ya hubo entradas y egresos visibles, aunque falta confirmar un cobro relacionado.",
    summaryKind: "caution",
    actionLabel: "Ver evidencia",
    actionHref: "#changes-evidence",
  },
  stability: {
    children:
      "La direccion del cambio se entiende. Lo que sigue abierto es una parte puntual de la causalidad, no toda la lectura.",
    container: "none",
    kind: "caution",
  },
  actions: {
    primary: "update",
    primaryLabel: "Revisar antes de cerrar",
    secondaryActions: [
      { id: "evidence", label: "Ver evidencia" },
      { id: "facts", label: "Ver hechos" },
    ],
    state: "reduced",
  },
  explained: {
    title: "Hechos que explican este cambio",
    rows: [
      {
        kind: "with-status",
        label: "Transferencia recibida",
        supportingLabel: "Ayer - Cuenta principal",
        status: "Ya explica parte de la suba",
        value: "27.500",
        valuePrefix: "$",
      },
      {
        kind: "with-status",
        label: "Debito de servicios",
        supportingLabel: "Hoy - Cuenta principal",
        status: "Ya aplicado",
        value: "9.300",
        valuePrefix: "$",
      },
    ],
  },
  missing: {
    title: "Dato faltante que impide cerrar la explicacion",
    primaryLine:
      "Falta confirmar si un cobro relacionado ya impacto la cuenta principal o sigue pendiente de acreditacion.",
    causalLine:
      "Sin ese dato, la direccion del cambio se entiende, pero no puede cerrarse toda la cadena causal.",
    linkLabel: "Ver evidencia",
    linkHref: "#changes-evidence",
    state: "partial",
  },
  information: {
    title: "Evidencia de esta explicacion",
    primaryLine:
      "La mayor parte del cambio visible ya esta sostenida por hechos confirmados, pero un cobro sigue abierto.",
    causalLine:
      "Lo conocido explica la lectura actual de forma util. Lo faltante todavia impide cerrarla por completo.",
    linkLabel: "Ver evidencia",
    linkHref: "#changes-evidence",
    state: "partial",
  },
} satisfies ChangesViewModel;
