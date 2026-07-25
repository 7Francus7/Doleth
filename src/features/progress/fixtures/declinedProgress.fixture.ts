import type { ProgressViewModel } from "../model";
import { attentionPeriodEvidenceFixture } from "../evidence";
import { improvedProgressFixture } from "./improvedProgress.fixture";

/** Retroceso factual, cobertura parcial y un vencido: sin culpabilizar. */
export const declinedProgressFixture = {
  ...improvedProgressFixture,
  hero: {
    ...improvedProgressFixture.hero,
    scenario: "attention",
    stateText:
      "El resultado de este tramo es $214.800 menor que el del mismo tramo del mes anterior.",
    value: "112.300",
    valuePrefix: "-$",
    coverage: {
      title: "Cobertura de próximos pagos",
      value: 73,
      leftSummary: "Faltan $139.400",
      rightSummary: "$535.900",
      state: "atRisk",
      accessibleLabel: "Cobertura: $396.500 de tus cuentas contra $535.900 comprometidos.",
    },
  },
  evidence: attentionPeriodEvidenceFixture,
  comparison: {
    ...improvedProgressFixture.comparison,
    rows: [
      {
        label: "Resultado del tramo anterior",
        supportingLabel: "24 días · 11 con registro",
        value: "102.500",
        valuePrefix: "$",
      },
      {
        kind: "with-status",
        label: "Resultado de este tramo",
        supportingLabel: "24 días · 9 con registro",
        status: "Menor que el anterior",
        value: "112.300",
        valuePrefix: "-$",
        state: "attention",
      },
      {
        label: "Diferencia entre tramos",
        supportingLabel: "Misma cantidad de días en los dos tramos",
        value: "214.800",
        valuePrefix: "-$",
      },
    ],
    summary:
      "Los dos tramos cubren la misma cantidad de días, así que la diferencia de -$214.800 no viene de comparar períodos desiguales.",
    summaryKind: "attention",
  },
  indicators: {
    ...improvedProgressFixture.indicators,
    items: [
      {
        id: "net",
        label: "Resultado del período",
        reading: "-$112.300 entre ingresos y gastos del miércoles 1 al viernes 24 de julio.",
        formula: "Ingresos − gastos no anulados del período, sin transferencias.",
        reference: "$102.500 en el mismo tramo del lunes 1 al miércoles 24 de junio.",
        direction: null,
        state: "attention",
      },
      {
        id: "consistency",
        label: "Consistencia de registro",
        reading: "Registraste actividad en 9 de 24 días.",
        formula: "Días con al menos un movimiento no anulado sobre días transcurridos del período.",
        reference: "11 de 24 días en el tramo anterior.",
        direction: "up-is-better",
        state: "neutral",
        meter: {
          title: "Consistencia de registro",
          value: 38,
          leftSummary: "9 de 24 días",
          rightSummary: "38%",
          state: "partial",
          accessibleLabel: "Registraste movimientos en 9 de los 24 días transcurridos del período.",
        },
      },
      {
        id: "coverage",
        label: "Cobertura de próximos pagos",
        reading: "Tenés cubierto el 73% de los $535.900 comprometidos.",
        formula: "Dinero en cuentas activas sobre pagos pendientes del horizonte de 30 días.",
        reference: "Faltan $139.400 para cubrirlos con lo que tenés hoy.",
        direction: "up-is-better",
        state: "attention",
        meter: {
          title: "Cobertura de próximos pagos",
          value: 73,
          leftSummary: "Faltan $139.400",
          rightSummary: "$535.900",
          state: "atRisk",
          accessibleLabel: "Cobertura: $396.500 de tus cuentas contra $535.900 comprometidos.",
        },
      },
      {
        id: "overdue",
        label: "Pagos vencidos",
        reading: "2 pagos vencidos siguen pendientes de confirmar.",
        formula: "Pagos pendientes con vencimiento anterior a hoy.",
        reference: "Se cuentan sobre el estado actual, no contra el período anterior.",
        direction: "down-is-better",
        state: "attention",
      },
    ],
  },
  milestones: {
    ...improvedProgressFixture.milestones,
    items: [
      { id: "first-comparable-period", label: "Primer período comparable", detail: "Ya tenés dos tramos equivalentes con movimientos: se puede comparar.", achieved: true },
      { id: "positive-patrimony", label: "Patrimonio positivo", detail: "La suma de tus cuentas está por encima de cero.", achieved: true },
      { id: "full-coverage", label: "Cobertura completa", detail: "Todavía no alcanza para cubrir todos los pagos cargados.", achieved: false },
      { id: "no-overdue", label: "Sin pagos vencidos", detail: "Queda al menos un pago vencido sin confirmar.", achieved: false },
      { id: "consistent-registration", label: "Registro sostenido", detail: "Todavía registrás movimientos en menos de la mitad de los días.", achieved: false },
    ],
  },
  stability: { ...improvedProgressFixture.stability, kind: "attention" },
  actions: {
    primary: "resolve",
    primaryLabel: "Revisar próximos pagos",
    secondaryActions: [
      { id: "changes", label: "Ver qué cambió" },
      { id: "history", label: "Ver movimientos" },
    ],
    state: "default",
  },
} satisfies ProgressViewModel;
