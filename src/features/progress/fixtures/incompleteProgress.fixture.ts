import type { ProgressViewModel } from "../model";
import { incompletePeriodEvidenceFixture } from "../evidence";

export const incompleteProgressFixture = {
  rail: {
    items: ["Periodo actual", "ARS", "Personal", "Informacion parcial"],
    state: "partial",
    wrap: "truncate",
  },
  banner: null,
  hero: {
    scenario: "incomplete",
    stateText: "La direccion del periodo se ve, pero el cierre no llega.",
    value: "26.200",
    valuePrefix: "$",
    valueLabel: "Avance conocido del periodo",
    inlineNote: "Dos dimensiones ya estan reconciliadas; falta una valuacion al cierre.",
    coverage: {
      title: "Cierre del periodo",
      value: 66,
      leftSummary: "Parcial",
      rightSummary: "Falta una valuacion",
      state: "partial",
    },
  },
  evidence: incompletePeriodEvidenceFixture,
  comparison: {
    title: "Comparacion de cierres",
    supportingLine: "Cierre anterior y lectura actual de la misma base",
    rows: [
      {
        label: "Cierre del periodo anterior",
        supportingLabel: "Ultima lectura cerrada comparable",
        value: "621.300",
        valuePrefix: "$",
      },
      {
        kind: "with-status",
        label: "Lectura actual",
        supportingLabel: "Hoy - Misma base patrimonial",
        status: "Falta cerrar una dimension",
        state: "partial",
        value: "647.500",
        valuePrefix: "$",
      },
    ],
    summary:
      "Hay direccion visible hacia arriba, pero el periodo no cierra hasta actualizar la valuacion de inversiones.",
    summaryKind: "caution",
    actionLabel: "Ver evidencia",
    actionHref: "#progress-evidence",
  },
  stability: {
    children:
      "La trayectoria se entiende. Lo que sigue abierto es un dato puntual de valuacion, no toda la lectura del periodo.",
    container: "none",
    kind: "caution",
  },
  actions: {
    primary: "update",
    primaryLabel: "Actualizar valuacion",
    secondaryActions: [
      { id: "evidence", label: "Ver evidencia" },
      { id: "goals", label: "Ver objetivos" },
    ],
    state: "reduced",
  },
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
  missing: {
    title: "Dato faltante que impide cerrar el periodo",
    primaryLine:
      "Falta la valuacion de inversiones al cierre; la ultima referencia conocida quedo antes del corte.",
    causalLine:
      "Sin ese dato, la direccion se entiende, pero la lectura del periodo no puede cerrarse por completo.",
    linkLabel: "Ver evidencia",
    linkHref: "#progress-evidence",
    state: "partial",
  },
  information: {
    title: "Evidencia de esta trayectoria",
    primaryLine:
      "La mayor parte del movimiento ya esta sostenida por dimensiones confirmadas, pero una valuacion sigue abierta.",
    causalLine:
      "Lo conocido orienta la trayectoria de forma util. Lo faltante todavia impide cerrarla por completo.",
    linkLabel: "Ver evidencia",
    linkHref: "#progress-evidence",
    state: "partial",
  },
} satisfies ProgressViewModel;
