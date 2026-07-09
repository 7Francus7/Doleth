import type { ProgressViewModel } from "../model";
import { stablePeriodEvidenceFixture } from "../evidence";

export const stableProgressFixture = {
  rail: {
    items: ["Periodo actual", "ARS", "Personal", "Informacion completa"],
    state: "complete",
    wrap: "truncate",
  },
  banner: null,
  hero: {
    scenario: "stable",
    stateText: "Tu situacion se movio hacia arriba en este periodo.",
    value: "68.300",
    valuePrefix: "$",
    valueLabel: "Avance del periodo",
    inlineNote: "La base crecio respecto del cierre anterior ya conocido.",
    coverage: {
      title: "Cierre del periodo",
      value: 100,
      leftSummary: "Cerrado",
      rightSummary: "3 dimensiones reconciliadas",
      state: "stable",
    },
  },
  evidence: stablePeriodEvidenceFixture,
  comparison: {
    title: "Comparacion de cierres",
    supportingLine: "Cierre anterior y lectura actual de la misma base",
    rows: [
      {
        label: "Cierre del periodo anterior",
        supportingLabel: "Ultima lectura cerrada comparable",
        value: "579.200",
        valuePrefix: "$",
      },
      {
        kind: "with-status",
        label: "Lectura actual",
        supportingLabel: "Hoy - Misma base patrimonial",
        status: "Periodo ya reconciliado",
        value: "647.500",
        valuePrefix: "$",
      },
    ],
    summary:
      "Este periodo termina mas arriba que el anterior por dimensiones ya reconciliadas, sin depender de interpretacion extra.",
    summaryKind: "stable",
    actionLabel: "Ver evidencia",
    actionHref: "#progress-evidence",
  },
  stability: {
    children:
      "La direccion de este periodo se sostiene con liquidez, deuda e inversion ya reconciliadas.",
    container: "none",
    kind: "stable",
  },
  actions: null,
  goals: {
    title: "Avance de objetivos",
    supportingLine: "Solo metas declaradas con monto",
    meters: [
      {
        title: "Fondo de emergencia",
        value: 62,
        leftSummary: "62% reservado",
        rightSummary: "$75.000 de $120.000",
        state: "stable",
      },
    ],
  },
  missing: null,
  information: {
    title: "Evidencia de esta trayectoria",
    primaryLine:
      "El movimiento del periodo puede comprobarse con dimensiones identificadas, montos visibles y una base de comparacion cerrada.",
    causalLine:
      "No hace falta interpretar de mas: la trayectoria se compone de movimientos registrados y localizables.",
    linkLabel: "Ver evidencia",
    linkHref: "#progress-evidence",
    state: "complete",
  },
} satisfies ProgressViewModel;
