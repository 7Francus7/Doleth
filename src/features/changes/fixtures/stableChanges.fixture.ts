import type { ChangesViewModel } from "../model";
import { stableChangeEvidenceFixture } from "../evidence";

export const stableChangesFixture = {
  rail: {
    items: ["Ultimos 7 dias", "ARS", "Personal", "Informacion completa"],
    state: "complete",
    wrap: "truncate",
  },
  banner: null,
  hero: {
    scenario: "stable",
    stateText: "Hoy estas distinto por hechos ya registrados.",
    value: "31.500",
    valuePrefix: "$",
    valueLabel: "Cambio neto visible",
    inlineNote: "La lectura actual se entiende por ingresos y egresos ya aplicados.",
    coverage: {
      title: "Explicacion conocida",
      value: 100,
      leftSummary: "Explicado",
      rightSummary: "$31.500 netos",
      state: "stable",
    },
  },
  evidence: stableChangeEvidenceFixture,
  comparison: {
    title: "Comparacion breve",
    supportingLine: "Base previa y lectura actual",
    rows: [
      {
        label: "Base previa visible",
        supportingLabel: "Ultima lectura comparable",
        value: "388.320",
        valuePrefix: "$",
      },
      {
        kind: "with-status",
        label: "Lectura actual",
        supportingLabel: "Hoy - Cuenta principal",
        status: "Cambio ya explicado",
        value: "419.820",
        valuePrefix: "$",
      },
    ],
    summary:
      "Hoy estas mas arriba porque ya se acreditaron ingresos recientes y ya se aplicaron salidas visibles sobre la base previa.",
    summaryKind: "stable",
    actionLabel: "Ver evidencia",
    actionHref: "#changes-evidence",
  },
  stability: {
    children:
      "Lo que paso recientemente alcanza para explicar por que hoy estas distinto que antes.",
    container: "none",
    kind: "stable",
  },
  actions: null,
  explained: {
    title: "Hechos que explican este cambio",
    rows: [
      {
        kind: "with-status",
        label: "Cobro de cliente",
        supportingLabel: "Lunes - Cuenta principal",
        status: "Explica la mayor parte de la suba actual",
        value: "58.000",
        valuePrefix: "$",
      },
      {
        kind: "with-status",
        label: "Pago de tarjeta",
        supportingLabel: "Martes - Cuenta principal",
        status: "Ya aplicado sobre la lectura actual",
        value: "21.500",
        valuePrefix: "$",
      },
      {
        kind: "with-status",
        label: "Ajuste de efectivo",
        supportingLabel: "Miercoles - Caja personal",
        status: "Corrige el cierre visible de hoy",
        value: "5.000",
        valuePrefix: "$",
      },
    ],
  },
  missing: null,
  information: {
    title: "Evidencia de esta explicacion",
    primaryLine:
      "La variacion visible hoy ya puede comprobarse con hechos recientes, montos visibles y objetos identificados.",
    causalLine:
      "No hace falta interpretar de mas: la lectura actual cambia por causas registradas y localizables.",
    linkLabel: "Ver evidencia",
    linkHref: "#changes-evidence",
    state: "complete",
  },
} satisfies ChangesViewModel;
