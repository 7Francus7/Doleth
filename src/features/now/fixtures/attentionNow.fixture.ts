import type { NowViewModel } from "../model";

export const attentionNowFixture = {
  rail: {
    items: ["Actualizado hace 2 min", "ARS", "Personal", "Información completa"],
    state: "complete",
    wrap: "truncate",
  },
  banner: {
    title: "Necesita atención hoy",
    detail: "Vence tu tarjeta Visa mañana y faltan $57.820.",
    actionLabel: "Resolver ahora",
    actionId: "resolve",
  },
  hero: {
    scenario: "attention",
    stateText: "Necesita atención",
    value: "432.180",
    valuePrefix: "$",
    valueLabel: "Disponibles hasta el viernes",
    tone: "state-raised",
    coverage: {
      title: "Próximos 7 días",
      value: 62,
      leftSummary: "Cobertura en riesgo",
      rightSummary: "$57.820 pendientes",
      state: "atRisk",
    },
  },
  stability: {
    children: "Conviene cubrir este pago antes de hacer otra compra importante.",
    container: "none",
    kind: "attention",
  },
  actions: {
    primary: "resolve",
    primaryLabel: "Resolver ahora",
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
  information: {
    title: "Cómo sabemos esto",
    primaryLine: "La información continúa completa y actualizada.",
    causalLine:
      "Incluye $610.000 líquidos, menos $120.000 reservados y $57.820 en pagos próximos.",
    linkLabel: "Ver evidencia",
    linkHref: "#evidence",
    state: "complete",
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
