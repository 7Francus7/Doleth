import type { NowViewModel } from "../model";
import { availableEvidenceFixture } from "../evidence/fixtures";

export const attentionNowFixture = {
  rail: {
    items: ["Actualizado hace 2 min", "ARS", "Personal", "Información completa"],
    state: "complete",
    wrap: "truncate",
  },
  banner: {
    title: "Necesita atención hoy",
    detail: "Vence tu tarjeta Visa mañana y faltan $57.820.",
    actionLabel: "Ver cómo resolverlo",
    actionId: "resolve",
  },
  hero: {
    scenario: "attention",
    stateText: "Hoy necesita atención",
    value: "432.180",
    valuePrefix: "$",
    valueLabel: "Disponible para decidir hoy",
    tone: "state-raised",
    coverage: {
      title: "Próximos 7 días",
      value: 62,
      leftSummary: "Cobertura en riesgo",
      rightSummary: "$57.820 pendientes",
      state: "atRisk",
    },
  },
  evidence: availableEvidenceFixture,
  stability: {
    children: "Primero resolvé Visa. El resto puede esperar hasta cubrirla.",
    container: "none",
    kind: "attention",
  },
  actions: {
    primary: "resolve",
    primaryLabel: "Ver cómo resolverlo",
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
  information: {
    title: "Confianza de esta lectura",
    primaryLine: "La lectura sigue completa y vigente.",
    causalLine: "El faltante y la cobertura se apoyan en datos confirmados de hoy.",
    linkLabel: "Ver evidencia",
    linkHref: "#evidence",
    state: "complete",
  },
  reserve: {
    title: "Puede esperar hoy",
    amount: "120.000",
    amountPrefix: "$",
    purposeLine: "No hace falta moverlo antes de resolver este vencimiento.",
    priority: "normal",
    state: "active",
  },
} satisfies NowViewModel;
