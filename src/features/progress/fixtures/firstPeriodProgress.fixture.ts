import type { ProgressViewModel } from "../model";
import { incompletePeriodEvidenceFixture } from "../evidence";
import { improvedProgressFixture } from "./improvedProgress.fixture";

/** Primer tramo con movimientos: información insuficiente para afirmar progreso. */
export const firstPeriodProgressFixture = {
  ...improvedProgressFixture,
  rail: { items: ["Días 1 a 24", "ARS", "Personal", "Primer período"], state: "partial", wrap: "truncate" },
  hero: {
    ...improvedProgressFixture.hero,
    stateText: "Este es tu primer tramo con movimientos: todavía no hay contra qué compararlo.",
    value: "84.500",
    valuePrefix: "$",
    coverage: {
      title: "Consistencia de registro",
      value: 17,
      leftSummary: "4 de 24 días",
      rightSummary: "17%",
      state: "partial",
      accessibleLabel: "Registraste movimientos en 4 de los 24 días transcurridos del período.",
    },
  },
  evidence: incompletePeriodEvidenceFixture,
  comparison: {
    ...improvedProgressFixture.comparison,
    rows: [
      {
        label: "Resultado del tramo anterior",
        supportingLabel: "Sin movimientos registrados",
        value: "0",
        valuePrefix: "$",
      },
      {
        kind: "with-status",
        label: "Resultado de este tramo",
        supportingLabel: "24 días · 4 con registro",
        status: "Sin referencia todavía",
        value: "84.500",
        valuePrefix: "$",
        state: "default",
      },
      {
        label: "Diferencia entre tramos",
        supportingLabel: "Misma cantidad de días en los dos tramos",
        value: "84.500",
        valuePrefix: "$",
      },
    ],
    summary:
      "No hay movimientos del lunes 1 al miércoles 24 de junio: sin ese tramo no se puede afirmar mejora ni retroceso.",
    summaryKind: "neutral",
  },
  indicators: {
    ...improvedProgressFixture.indicators,
    items: [
      {
        id: "net",
        label: "Resultado del período",
        reading: "$84.500 entre ingresos y gastos del miércoles 1 al viernes 24 de julio.",
        formula: "Ingresos − gastos no anulados del período, sin transferencias.",
        reference: "Todavía no hay un tramo anterior con movimientos para comparar.",
        direction: null,
        state: "neutral",
      },
      {
        id: "consistency",
        label: "Consistencia de registro",
        reading: "Registraste actividad en 4 de 24 días.",
        formula: "Días con al menos un movimiento no anulado sobre días transcurridos del período.",
        reference: "Sin tramo anterior comparable.",
        direction: "up-is-better",
        state: "neutral",
        meter: {
          title: "Consistencia de registro",
          value: 17,
          leftSummary: "4 de 24 días",
          rightSummary: "17%",
          state: "partial",
          accessibleLabel: "Registraste movimientos en 4 de los 24 días transcurridos del período.",
        },
      },
    ],
  },
  milestones: {
    ...improvedProgressFixture.milestones,
    items: [
      { id: "first-comparable-period", label: "Primer período comparable", detail: "Cuando el tramo anterior tenga movimientos vas a poder comparar períodos.", achieved: false },
      { id: "positive-patrimony", label: "Patrimonio positivo", detail: "La suma de tus cuentas está por encima de cero.", achieved: true },
      { id: "full-coverage", label: "Cobertura completa", detail: "Todavía no alcanza para cubrir todos los pagos cargados.", achieved: false },
      { id: "no-overdue", label: "Sin pagos vencidos", detail: "Queda al menos un pago vencido sin confirmar.", achieved: false },
      { id: "consistent-registration", label: "Registro sostenido", detail: "Todavía registrás movimientos en menos de la mitad de los días.", achieved: false },
    ],
  },
  notice: "Pudimos calcular el resultado del período, pero no cargar los próximos pagos: la cobertura queda fuera de esta lectura.",
  stability: {
    children: "Con un solo tramo no hay contra qué comparar: el progreso se lee con historia.",
    container: "none",
    kind: "neutral",
  },
  actions: {
    primary: "register",
    primaryLabel: "Completar información",
    secondaryActions: [
      { id: "changes", label: "Ver qué cambió" },
      { id: "history", label: "Ver movimientos" },
    ],
    state: "default",
  },
  missing: {
    title: "Todavía sin historia comparable",
    primaryLine: "Necesitás movimientos del lunes 1 al miércoles 24 de junio para leer mejora o retroceso.",
    causalLine: "Seguí registrando: la comparación aparece cuando los dos tramos tienen movimientos.",
    linkLabel: "Registrar movimiento",
    linkHref: "/movimientos/nuevo",
    state: "partial",
  },
  information: { ...improvedProgressFixture.information, state: "partial" },
} satisfies ProgressViewModel;
