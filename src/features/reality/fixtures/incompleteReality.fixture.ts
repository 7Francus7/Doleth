import type { RealityViewModel } from "../model";
import { incompleteRealityEvidenceFixture } from "../evidence";

export const incompleteRealityFixture = {
  rail: {
    items: ["Corte de hoy", "ARS", "Personal", "Informacion parcial"],
    state: "partial",
    wrap: "truncate",
  },
  banner: null,
  hero: {
    scenario: "incomplete",
    stateText: "Tu estructura se reconoce, pero no cierra completa.",
    value: "342.500",
    valuePrefix: "$",
    valueLabel: "Base conocida hoy",
    inlineNote: "Cuatro dominios ya estan confirmados; falta una valuacion vigente.",
    coverage: {
      title: "Base confirmada",
      value: 54,
      leftSummary: "Parcial",
      rightSummary: "Falta una valuacion",
      state: "partial",
    },
  },
  evidence: incompleteRealityEvidenceFixture,
  composition: {
    title: "Composicion por dominio",
    supportingLine: "Lo que aporta y lo que compromete valor",
    rows: [
      {
        label: "Lo que aporta valor",
        supportingLabel: "Cuentas y reservas confirmadas",
        value: "487.000",
        valuePrefix: "$",
      },
      {
        kind: "with-status",
        label: "Lo que compromete valor",
        supportingLabel: "Tarjetas y deudas netas",
        status: "Inversiones fuera de la base hasta actualizarse",
        state: "partial",
        value: "144.500",
        valuePrefix: "$",
      },
    ],
    summary:
      "Hay distribucion visible, pero la base no cierra completa hasta actualizar la valuacion de inversiones.",
    summaryKind: "caution",
    actionLabel: "Ver evidencia",
    actionHref: "#reality-evidence",
  },
  stability: {
    children:
      "La estructura se entiende. Lo que sigue abierto es un dato puntual de valuacion, no toda la base.",
    container: "none",
    kind: "caution",
  },
  actions: {
    primary: "update",
    primaryLabel: "Actualizar valuacion",
    secondaryActions: [
      { id: "evidence", label: "Ver evidencia" },
      { id: "domains", label: "Ver dominios" },
    ],
    state: "reduced",
  },
  domains: {
    title: "Dominios de la estructura",
    rows: [
      {
        kind: "with-status",
        label: "Cuentas",
        supportingLabel: "3 cuentas - Dinero disponible y en resguardo",
        status: "Saldos confirmados",
        value: "412.000",
        valuePrefix: "$",
      },
      {
        kind: "with-status",
        label: "Tarjetas",
        supportingLabel: "2 tarjetas - Consumo financiado pendiente",
        status: "Cierres confirmados",
        value: "96.500",
        valuePrefix: "$",
      },
      {
        kind: "with-status",
        label: "Deudas y cobros",
        supportingLabel: "2 relaciones - Neto entre debes y te deben",
        status: "Condiciones confirmadas",
        value: "48.000",
        valuePrefix: "$",
      },
      {
        kind: "with-status",
        label: "Inversiones",
        supportingLabel: "2 posiciones - Ultima valuacion hace 3 meses",
        status: "Valuacion desactualizada",
        state: "partial",
        value: "290.000",
        valuePrefix: "$",
      },
      {
        kind: "with-status",
        label: "Objetivos y reservas",
        supportingLabel: "1 objetivo - Dinero con proposito",
        status: "Reserva asignada",
        value: "75.000",
        valuePrefix: "$",
      },
    ],
  },
  missing: {
    title: "Dato faltante que deja la composicion abierta",
    primaryLine:
      "Falta una valuacion vigente de inversiones; la ultima referencia conocida tiene tres meses.",
    causalLine:
      "Sin ese dato, la distribucion se entiende, pero la base patrimonial no puede cerrarse por completo.",
    linkLabel: "Ver evidencia",
    linkHref: "#reality-evidence",
    state: "partial",
  },
  information: {
    title: "Evidencia de esta composicion",
    primaryLine:
      "La mayor parte de la base ya esta sostenida por valores confirmados, pero una valuacion sigue abierta.",
    causalLine:
      "Lo registrado sostiene la composicion de forma util. Lo faltante todavia impide cerrarla por completo.",
    linkLabel: "Ver evidencia",
    linkHref: "#reality-evidence",
    state: "partial",
  },
} satisfies RealityViewModel;
