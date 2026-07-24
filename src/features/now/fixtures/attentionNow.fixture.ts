import type { NowViewModel } from "../model";
import { availableEvidenceFixture } from "../evidence/fixtures";

// Atención concreta: hay un pago vencido y se nombra cuál. Sin alarmismo y sin
// pintar toda la pantalla de rojo.
export const attentionNowFixture = {
  rail: {
    items: ["Dinero en cuentas", "ARS", "Personal", "Información completa"],
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
    value: "428.500",
    valuePrefix: "$",
    valueLabel: "Dinero en tus cuentas",
    inlineNote: "Hay $96.000 comprometidos hasta el domingo 23 de agosto.",
    tone: "state-raised",
    coverage: {
      title: "Cobertura de lo comprometido",
      value: 100,
      leftSummary: "Cubierto",
      rightSummary: "$96.000",
      state: "stable",
      accessibleLabel: "Cobertura: $96.000 cubiertos de $96.000 comprometidos.",
    },
  },
  evidence: availableEvidenceFixture,
  projection: {
    title: "Después de pagar",
    headline: "Después de los pagos cargados quedarían aproximadamente $332.500.",
    amount: "332.500",
    amountPrefix: "$",
    amountState: "default",
    rows: [
      { label: "Dinero en tus cuentas", value: "428.500", valuePrefix: "$" },
      { label: "Comprometido", value: "96.000", valuePrefix: "-$" },
      { label: "Quedarían", value: "332.500", valuePrefix: "$" },
    ],
    note: "Incluye 3 pagos cargados con vencimiento hasta el domingo 23 de agosto. Los importes de próximos pagos son previstos, así que el resultado es aproximado.",
    excludedNote: "Quedan 2 pagos por $54.000 después de esa fecha: no están incluidos acá.",
    linkLabel: "Ver próximos pagos",
    linkHref: "/proximo",
  },
  stability: {
    children:
      "Cada importe sale de tus saldos iniciales y de los movimientos no anulados. Los próximos pagos no descuentan nada hasta que los confirmes.",
    container: "none",
    kind: "attention",
  },
  actions: {
    primary: "resolve",
    primaryLabel: "Revisar próximos pagos",
    secondaryActions: [
      { id: "upcoming", label: "Ver próximos pagos" },
      { id: "history", label: "Ver movimientos" },
    ],
    state: "default",
  },
  position: {
    title: "Este mes",
    rows: [
      { label: "Ingresos", value: "310.000", valuePrefix: "$" },
      { label: "Gastos", value: "184.300", valuePrefix: "$" },
      { label: "Diferencia", value: "125.700", valuePrefix: "$" },
    ],
  },
  accounts: [
    { id: "banco", name: "Banco principal", type: "Banco", balance: "300.000", balancePrefix: "$", state: "stable" },
    { id: "billetera", name: "Billetera virtual", type: "Billetera", balance: "96.500", balancePrefix: "$", state: "stable" },
    { id: "efectivo", name: "Efectivo", type: "Efectivo", balance: "32.000", balancePrefix: "$", state: "stable" },
  ],
  operational: [
    {
      title: "Próximos pagos",
      actionLabel: "Ver todos",
      actionHref: "/proximo",
      rows: [
        {
          kind: "navigable",
          label: "Internet",
          supportingLabel: "Ayer · Banco principal",
          value: "18.500",
          valuePrefix: "$",
          href: "/proximo/internet",
          state: "attention",
        },
        {
          kind: "navigable",
          label: "Tarjeta Visa",
          supportingLabel: "Viernes 31 de julio · Banco principal",
          value: "46.000",
          valuePrefix: "$",
          href: "/proximo/visa",
        },
      ],
    },
    {
      title: "Movimientos recientes",
      actionLabel: "Ver historial",
      actionHref: "/movimientos",
      notice: "No pudimos cargar los movimientos recientes. Tu saldo principal sigue disponible.",
      rows: [],
    },
  ],
  investments: null,
  information: {
    title: "De dónde sale esta lectura",
    primaryLine: "3 cuentas registradas; 3 pagos próximos considerados.",
    causalLine:
      "Los saldos se derivan del saldo inicial y del ledger, excluyendo movimientos anulados. Las transferencias entre tus cuentas no alteran el total.",
    linkLabel: "Ver movimientos",
    linkHref: "/movimientos",
    state: "partial",
  },
} satisfies NowViewModel;
