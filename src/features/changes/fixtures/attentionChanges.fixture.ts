import type { ChangesViewModel } from "../model";
import { attentionChangeEvidenceFixture } from "../evidence";

export const attentionChangesFixture = {
  rail: {
    items: ["Ultimos 7 dias", "ARS", "Personal", "Informacion parcial"],
    state: "partial",
    wrap: "truncate",
  },
  banner: {
    title: "Un ajuste dominante cambio la lectura actual y conviene confirmarlo.",
    detail: "Hoy estas distinto sobre todo por un movimiento que todavia no esta cerrado del todo.",
    actionLabel: "Corregir esta lectura",
  },
  hero: {
    scenario: "attention",
    tone: "state-raised",
    stateText: "Hoy estas mas abajo por un ajuste que sigue abierto.",
    value: "84.000",
    valuePrefix: "$",
    valueLabel: "Impacto dominante visible",
    inlineNote: "El resto de la actividad reciente no explica por si sola esta caida.",
    coverage: {
      title: "Explicacion conocida",
      value: 41,
      leftSummary: "Abierta",
      rightSummary: "$84.000 por confirmar",
      state: "atRisk",
    },
  },
  evidence: attentionChangeEvidenceFixture,
  comparison: {
    title: "Comparacion breve",
    supportingLine: "Base previa y lectura actual",
    rows: [
      {
        label: "Antes del ajuste dominante",
        supportingLabel: "Base previa visible",
        value: "502.400",
        valuePrefix: "$",
      },
      {
        kind: "with-status",
        label: "Lectura actual",
        supportingLabel: "Hoy - Cuenta principal",
        status: "Cambio dominante abierto",
        state: "attention",
        value: "418.400",
        valuePrefix: "$",
      },
    ],
    summary:
      "Hoy estas distinto porque una correccion grande ya altero la lectura, aunque su causa exacta todavia no quedo cerrada.",
    summaryKind: "attention",
    actionLabel: "Ver evidencia",
    actionHref: "#changes-evidence",
  },
  stability: {
    children:
      "La mayor parte del movimiento reciente no genera duda. El problema esta concentrado en un solo ajuste dominante.",
    container: "none",
    kind: "attention",
  },
  actions: {
    primary: "resolve",
    primaryLabel: "Corregir esta lectura",
    secondaryActions: [
      { id: "evidence", label: "Ver evidencia" },
      { id: "facts", label: "Ver hechos" },
    ],
    state: "reduced",
  },
  explained: {
    title: "Hechos que explican este cambio",
    rows: [
      {
        kind: "with-status",
        label: "Pago de servicio",
        supportingLabel: "Hoy - Debito automatico",
        status: "Ya explica parte de la baja",
        value: "18.000",
        valuePrefix: "$",
      },
      {
        kind: "with-status",
        label: "Ajuste manual de cuenta",
        supportingLabel: "Hoy - Cuenta principal",
        status: "Cambia fuerte la lectura actual",
        state: "attention",
        value: "84.000",
        valuePrefix: "$",
      },
    ],
  },
  missing: {
    title: "Dato faltante que impide cerrar la explicacion",
    primaryLine:
      "Falta confirmar si el ajuste manual refleja un faltante real o una correccion transitoria.",
    causalLine:
      "Mientras ese punto siga abierto, la lectura actual queda afectada por una causa dominante pero incompleta.",
    linkLabel: "Ver evidencia",
    linkHref: "#changes-evidence",
    state: "conflict",
  },
  information: {
    title: "Evidencia de esta explicacion",
    primaryLine:
      "La baja visible hoy existe, pero su explicacion principal todavia requiere una confirmacion adicional.",
    causalLine:
      "Los hechos menores ya estan claros. La duda material esta concentrada en un ajuste dominante.",
    linkLabel: "Ver evidencia",
    linkHref: "#changes-evidence",
    state: "partial",
  },
} satisfies ChangesViewModel;
