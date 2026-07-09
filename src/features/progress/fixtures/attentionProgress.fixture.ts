import type { ProgressViewModel } from "../model";
import { attentionPeriodEvidenceFixture } from "../evidence";

export const attentionProgressFixture = {
  rail: {
    items: ["Periodo actual", "ARS", "Personal", "Informacion parcial"],
    state: "partial",
    wrap: "truncate",
  },
  banner: {
    title: "El periodo retrocedio y una deuda nueva domina ese movimiento.",
    detail: "El cargo principal todavia no tiene cierre confirmado.",
    actionLabel: "Confirmar esta deuda",
  },
  hero: {
    scenario: "attention",
    tone: "state-raised",
    stateText: "El periodo retrocedio por una causa dominante.",
    value: "73.300",
    valuePrefix: "$",
    valueLabel: "Retroceso del periodo",
    inlineNote: "La mayor parte del retroceso depende de una deuda sin cierre confirmado.",
    coverage: {
      title: "Cierre del periodo",
      value: 41,
      leftSummary: "Abierto",
      rightSummary: "Deuda sin confirmar",
      state: "atRisk",
    },
  },
  evidence: attentionPeriodEvidenceFixture,
  comparison: {
    title: "Comparacion de cierres",
    supportingLine: "Cierre anterior y lectura actual de la misma base",
    rows: [
      {
        label: "Cierre del periodo anterior",
        supportingLabel: "Ultima lectura cerrada comparable",
        value: "720.800",
        valuePrefix: "$",
      },
      {
        kind: "with-status",
        label: "Lectura actual",
        supportingLabel: "Hoy - Misma base patrimonial",
        status: "Retroceso dominado por una deuda",
        state: "attention",
        value: "647.500",
        valuePrefix: "$",
      },
    ],
    summary:
      "Este periodo termina mas abajo que el anterior, y la causa principal todavia exige una confirmacion.",
    summaryKind: "attention",
    actionLabel: "Ver evidencia",
    actionHref: "#progress-evidence",
  },
  stability: {
    children:
      "La mayor parte del periodo no genera duda. El retroceso esta concentrado en una deuda nueva sin cierre confirmado.",
    container: "none",
    kind: "attention",
  },
  actions: {
    primary: "resolve",
    primaryLabel: "Confirmar esta deuda",
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
    title: "Dato en conflicto que impide cerrar el periodo",
    primaryLine:
      "La deuda nueva que domina el retroceso todavia no tiene cierre confirmado.",
    causalLine:
      "Mientras ese punto siga abierto, la trayectoria del periodo queda sostenida solo por las dimensiones confirmadas.",
    linkLabel: "Ver evidencia",
    linkHref: "#progress-evidence",
    state: "conflict",
  },
  information: {
    title: "Evidencia de esta trayectoria",
    primaryLine:
      "El retroceso visible existe, pero su causa principal todavia requiere una confirmacion adicional.",
    causalLine:
      "Las dimensiones menores ya estan claras. La duda material esta concentrada en una sola deuda.",
    linkLabel: "Ver evidencia",
    linkHref: "#progress-evidence",
    state: "partial",
  },
} satisfies ProgressViewModel;
