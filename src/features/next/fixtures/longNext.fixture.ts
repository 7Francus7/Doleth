import type { NextViewModel } from "../model";
import { longHorizonEvidenceFixture } from "../evidence";

// Línea temporal larga: los siete tramos con pagos, para verificar densidad,
// legibilidad y el cruce a saldo negativo a mitad de la lista.
// Base $300.000 · pendiente $318.000 · saldo final −$18.000.
const payment = (
  id: string,
  concept: string,
  amount: string,
  dateLabel: string,
  balanceAfterLabel: string,
  balanceAfterState: "default" | "attention" = "default",
  state: "overdue" | "due-today" | "pending" = "pending",
) => ({
  id,
  concept,
  href: `/proximo/${id}`,
  amount,
  amountPrefix: "$",
  dateLabel,
  accountName: "Banco principal",
  state,
  stateLabel: state === "overdue" ? "Vencido" : state === "due-today" ? "Vence hoy" : "Pendiente",
  balanceAfterLabel,
  balanceAfterState,
});

export const longNextFixture = {
  rail: {
    items: ["Próximos pagos", "ARS", "Personal", "Información completa"],
    state: "complete",
    wrap: "truncate",
  },
  banner: {
    title: "Hay 1 pago vencido.",
    detail: "Internet venció ayer y todavía figura pendiente.",
    actionLabel: "Revisar pago",
    actionId: "overdue",
  },
  hero: {
    scenario: "attention",
    stateText: "Hay 1 pago vencido.",
    value: "318.000",
    valuePrefix: "$",
    valueLabel: "Pagos pendientes cargados",
    inlineNote: "Después de estos pagos faltarían $18.000.",
    tone: "state-raised",
    coverage: {
      title: "Cobertura de los pagos cargados",
      value: 94,
      leftSummary: "Faltan $18.000",
      rightSummary: "$318.000",
      state: "atRisk",
      accessibleLabel: "Cobertura: $300.000 cubiertos de $318.000 en pagos cargados.",
    },
  },
  evidence: longHorizonEvidenceFixture,
  coverage: {
    headline: "Tenés cubiertos $300.000 de $318.000.",
    detail: "Faltan $18.000 para cubrir los pagos cargados.",
    meter: {
      title: "Cobertura de los pagos cargados",
      value: 94,
      leftSummary: "Faltan $18.000",
      rightSummary: "$318.000",
      state: "atRisk",
      accessibleLabel: "Cobertura: $300.000 cubiertos de $318.000 en pagos cargados.",
    },
    note: "Los importes de próximos pagos son los que vos cargaste, así que esta cobertura es aproximada.",
  },
  stability: {
    children: "Un pago previsto no es un movimiento: recién descuenta de tus cuentas cuando lo confirmás.",
    container: "none",
    kind: "attention",
  },
  actions: {
    primary: "resolve",
    primaryLabel: "Revisar pago vencido",
    secondaryActions: [
      { id: "now", label: "Volver a Ahora" },
      { id: "history", label: "Ver movimientos" },
    ],
    state: "default",
  },
  timeline: [
    {
      id: "overdue",
      title: "Vencidos",
      summary: "1 pago · $18.500",
      tone: "overdue",
      payments: [
        payment("internet", "Internet", "18.500", "Ayer", "Después de este pago quedarían aproximadamente $281.500.", "default", "overdue"),
      ],
      balanceAfterLabel: "Después de este pago quedarían aproximadamente $281.500.",
    },
    {
      id: "today",
      title: "Hoy",
      summary: "1 pago · $19.500",
      tone: "today",
      payments: [
        payment("gimnasio", "Gimnasio", "19.500", "Hoy", "Después de este pago quedarían aproximadamente $262.000.", "default", "due-today"),
      ],
      balanceAfterLabel: "Después de este pago quedarían aproximadamente $262.000.",
    },
    {
      id: "tomorrow",
      title: "Mañana",
      summary: "1 pago · $9.800",
      tone: "normal",
      payments: [
        payment("agua", "Agua", "9.800", "Mañana", "Después de este pago quedarían aproximadamente $252.200."),
      ],
      balanceAfterLabel: "Después de este pago quedarían aproximadamente $252.200.",
    },
    {
      id: "this-week",
      title: "Esta semana",
      summary: "2 pagos · $60.200",
      tone: "normal",
      payments: [
        payment("gas", "Gas", "14.200", "Lunes 27 de julio", "Después de este pago quedarían aproximadamente $238.000."),
        payment("visa", "Tarjeta Visa", "46.000", "Viernes 31 de julio", "Después de este pago quedarían aproximadamente $192.000."),
      ],
      balanceAfterLabel: "Después de estos pagos quedarían aproximadamente $192.000.",
    },
    {
      id: "next-month",
      title: "Agosto de 2026",
      summary: "2 pagos · $178.000",
      tone: "normal",
      payments: [
        payment("alquiler", "Alquiler", "120.000", "Sábado 1 de agosto", "Después de este pago quedarían aproximadamente $72.000."),
        payment("colegio", "Cuota del colegio", "58.000", "Lunes 10 de agosto", "Después de este pago quedarían aproximadamente $14.000."),
      ],
      balanceAfterLabel: "Después de estos pagos quedarían aproximadamente $14.000.",
    },
    {
      id: "later",
      title: "Más adelante",
      summary: "1 pago · $32.000",
      tone: "normal",
      payments: [
        payment("seguro", "Seguro del auto", "32.000", "Martes 15 de septiembre", "Después de este pago faltarían $18.000.", "attention"),
      ],
      balanceAfterLabel: "Después de este pago faltarían $18.000.",
    },
  ],
  empty: null,
  confirmed: {
    title: "Pagos confirmados",
    caption: "Ya son movimientos reales: no participan de la cobertura ni de la proyección.",
    rows: [
      {
        kind: "navigable",
        label: "Expensas",
        supportingLabel: "Miércoles 15 de julio · Banco principal",
        status: "Pagado",
        value: "37.400",
        valuePrefix: "$",
        href: "/proximo/expensas",
        state: "partial",
      },
    ],
  },
  information: {
    title: "Qué muestra esta pantalla",
    primaryLine: "8 pagos pendientes; 1 confirmado.",
    causalLine:
      "El saldo posterior descuenta solamente pagos pendientes, en orden de vencimiento. Confirmar un pago crea el movimiento una sola vez.",
    linkLabel: "Agregar pago previsto",
    linkHref: "/proximo/nuevo",
    state: "complete",
  },
  restorationKey: "/proximo",
} satisfies NextViewModel;
