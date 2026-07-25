import type { ProgressViewModel } from "../model";
import { stablePeriodEvidenceFixture } from "../evidence";

/** Base de las demás variantes: tramos equivalentes, mejora factual y cobertura completa. */
export const improvedProgressFixture = {
  rail: { items: ["Días 1 a 24", "ARS", "Personal", "Tramos equivalentes"], state: "complete", wrap: "truncate" },
  banner: null,
  hero: {
    scenario: "stable",
    stateText:
      "El resultado de este tramo es $128.400 mayor que el del mismo tramo del mes anterior.",
    value: "645.000",
    valuePrefix: "$",
    valueLabel: "Resultado del miércoles 1 al viernes 24 de julio",
    inlineNote: "Se compara contra el mismo tramo del mes anterior: del lunes 1 al miércoles 24 de junio.",
    coverage: {
      title: "Cobertura de próximos pagos",
      value: 100,
      leftSummary: "Cubierto",
      rightSummary: "$535.900",
      state: "stable",
      accessibleLabel: "Cobertura: $1.153.700 de tus cuentas contra $535.900 comprometidos.",
    },
  },
  evidence: stablePeriodEvidenceFixture,
  comparison: {
    title: "Tramos equivalentes",
    supportingLine:
      "del miércoles 1 al viernes 24 de julio contra del lunes 1 al miércoles 24 de junio",
    rows: [
      {
        label: "Resultado del tramo anterior",
        supportingLabel: "24 días · 11 con registro",
        value: "516.600",
        valuePrefix: "$",
      },
      {
        kind: "with-status",
        label: "Resultado de este tramo",
        supportingLabel: "24 días · 14 con registro",
        status: "Mayor que el anterior",
        value: "645.000",
        valuePrefix: "$",
        state: "default",
      },
      {
        label: "Diferencia entre tramos",
        supportingLabel: "Misma cantidad de días en los dos tramos",
        value: "128.400",
        valuePrefix: "$",
      },
    ],
    summary:
      "Los dos tramos cubren la misma cantidad de días, así que la diferencia de $128.400 no viene de comparar períodos desiguales.",
    summaryKind: "stable",
  },
  indicators: {
    title: "Indicadores del período",
    supportingLine: "Cada uno con su fórmula y su denominador a la vista",
    items: [
      {
        id: "net",
        label: "Resultado del período",
        reading: "$645.000 entre ingresos y gastos del miércoles 1 al viernes 24 de julio.",
        formula: "Ingresos − gastos no anulados del período, sin transferencias.",
        reference: "$516.600 en el mismo tramo del lunes 1 al miércoles 24 de junio.",
        direction: null,
        state: "neutral",
      },
      {
        id: "consistency",
        label: "Consistencia de registro",
        reading: "Registraste actividad en 14 de 24 días.",
        formula: "Días con al menos un movimiento no anulado sobre días transcurridos del período.",
        reference: "11 de 24 días en el tramo anterior.",
        direction: "up-is-better",
        state: "stable",
        meter: {
          title: "Consistencia de registro",
          value: 58,
          leftSummary: "14 de 24 días",
          rightSummary: "58%",
          state: "stable",
          accessibleLabel: "Registraste movimientos en 14 de los 24 días transcurridos del período.",
        },
      },
      {
        id: "coverage",
        label: "Cobertura de próximos pagos",
        reading: "Tenés cubierto el 100% de los $535.900 comprometidos.",
        formula: "Dinero en cuentas activas sobre pagos pendientes del horizonte de 30 días.",
        reference: "Los pagos cargados están cubiertos con el dinero de tus cuentas.",
        direction: "up-is-better",
        state: "stable",
        meter: {
          title: "Cobertura de próximos pagos",
          value: 100,
          leftSummary: "Cubierto",
          rightSummary: "$535.900",
          state: "stable",
          accessibleLabel: "Cobertura: $1.153.700 de tus cuentas contra $535.900 comprometidos.",
        },
      },
    ],
  },
  milestones: {
    title: "Hitos verificables",
    supportingLine: "Se derivan del estado actual: no se guardan ni se celebran dos veces",
    items: [
      {
        id: "first-comparable-period",
        label: "Primer período comparable",
        detail: "Ya tenés dos tramos equivalentes con movimientos: se puede comparar.",
        achieved: true,
      },
      {
        id: "positive-patrimony",
        label: "Patrimonio positivo",
        detail: "La suma de tus cuentas está por encima de cero.",
        achieved: true,
      },
      {
        id: "full-coverage",
        label: "Cobertura completa",
        detail: "El dinero de tus cuentas alcanza para todos los pagos cargados.",
        achieved: true,
      },
      {
        id: "no-overdue",
        label: "Sin pagos vencidos",
        detail: "No queda ningún pago cargado con la fecha pasada.",
        achieved: true,
      },
      {
        id: "consistent-registration",
        label: "Registro sostenido",
        detail: "Registraste movimientos en más de la mitad de los días del período.",
        achieved: true,
      },
    ],
  },
  notice: null,
  stability: {
    children:
      "Cada indicador tiene una fórmula explícita sobre datos reales y declara el período analizado.",
    container: "none",
    kind: "stable",
  },
  actions: {
    primary: "update",
    primaryLabel: "Ver cómo se calculó",
    secondaryActions: [
      { id: "changes", label: "Ver qué cambió" },
      { id: "history", label: "Ver movimientos" },
    ],
    state: "default",
  },
  missing: null,
  information: {
    title: "De dónde salen estos indicadores",
    primaryLine: "No usa metas inventadas ni presupuestos inexistentes.",
    causalLine:
      "Cada indicador se deriva del ledger real y compara tramos equivalentes, excluyendo movimientos anulados y transferencias entre tus cuentas.",
    linkLabel: "Ver movimientos",
    linkHref: "/movimientos",
    state: "complete",
  },
} satisfies ProgressViewModel;
