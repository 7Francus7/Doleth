import type { RealityViewModel } from "../model";
import { attentionRealityEvidenceFixture } from "../evidence";

export const attentionRealityFixture = {
  rail: {
    items: ["Corte de hoy", "ARS", "Personal", "Informacion parcial"],
    state: "partial",
    wrap: "truncate",
  },
  banner: {
    title: "Una cuenta de tu estructura esta en conflicto y conviene confirmarla.",
    detail: "El saldo registrado no coincide con su ultima referencia conocida.",
    actionLabel: "Corregir esta cuenta",
  },
  hero: {
    scenario: "attention",
    tone: "state-raised",
    stateText: "Un objeto de tu estructura esta en conflicto.",
    value: "235.500",
    valuePrefix: "$",
    valueLabel: "Base confirmada visible",
    inlineNote: "La cuenta en conflicto no se suma a la base hasta confirmarse.",
    coverage: {
      title: "Base confirmada",
      value: 58,
      leftSummary: "Abierta",
      rightSummary: "Cuentas en conflicto",
      state: "atRisk",
    },
  },
  evidence: attentionRealityEvidenceFixture,
  composition: {
    title: "Composicion por dominio",
    supportingLine: "Lo que aporta y lo que compromete valor",
    rows: [
      {
        label: "Lo que aporta valor",
        supportingLabel: "Inversiones y reservas confirmadas",
        value: "380.000",
        valuePrefix: "$",
      },
      {
        kind: "with-status",
        label: "Lo que compromete valor",
        supportingLabel: "Tarjetas y deudas netas",
        status: "Cuentas fuera de la base hasta confirmarse",
        state: "attention",
        value: "144.500",
        valuePrefix: "$",
      },
    ],
    summary:
      "La distribucion visible existe, pero la duda material esta concentrada en el saldo de la cuenta principal.",
    summaryKind: "attention",
    actionLabel: "Ver evidencia",
    actionHref: "#reality-evidence",
  },
  stability: {
    children:
      "La mayor parte de la estructura no genera duda. El conflicto esta concentrado en una sola cuenta.",
    container: "none",
    kind: "attention",
  },
  actions: {
    primary: "resolve",
    primaryLabel: "Corregir esta cuenta",
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
        supportingLabel: "3 cuentas - Saldo registrado en conflicto",
        status: "No se suma a la base hasta confirmarse",
        state: "attention",
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
        supportingLabel: "2 posiciones - Valuacion vigente",
        status: "Valuacion al dia",
        value: "305.000",
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
    title: "Dato en conflicto que deja la base abierta",
    primaryLine:
      "El saldo registrado de la cuenta principal no coincide con su ultima referencia conocida.",
    causalLine:
      "Mientras ese punto siga abierto, la base patrimonial queda sostenida solo por los dominios confirmados.",
    linkLabel: "Ver evidencia",
    linkHref: "#reality-evidence",
    state: "conflict",
  },
  information: {
    title: "Evidencia de esta composicion",
    primaryLine:
      "La estructura visible hoy existe, pero su base completa todavia requiere confirmar una cuenta.",
    causalLine:
      "Los dominios menores ya estan claros. La duda material esta concentrada en un solo saldo.",
    linkLabel: "Ver evidencia",
    linkHref: "#reality-evidence",
    state: "partial",
  },
} satisfies RealityViewModel;
