import type { NowViewModel } from "../model";
import { availableEvidenceFixture } from "../evidence/fixtures";

export const stableNowFixture = {
  rail: {
    items: ["Dinero en cuentas", "ARS", "Personal", "Información completa"],
    state: "complete",
    wrap: "truncate",
  },
  banner: null,
  hero: {
    scenario: "stable",
    stateText: "Tu situación está registrada y al día.",
    value: "428.500",
    valuePrefix: "$",
    valueLabel: "Dinero en tus cuentas",
    inlineNote: "Hay $96.000 comprometidos hasta el domingo 23 de agosto.",
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
    linkLabel: "Ver próximos pagos",
    linkHref: "/proximo",
  },
  stability: {
    children:
      "Cada importe sale de tus saldos iniciales y de los movimientos no anulados. Los próximos pagos no descuentan nada hasta que los confirmes.",
    container: "none",
    kind: "neutral",
  },
  actions: {
    primary: "register",
    primaryLabel: "Registrar un movimiento",
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
          supportingLabel: "Mañana · Banco principal",
          value: "18.500",
          valuePrefix: "$",
          href: "/proximo/internet",
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
      rows: [
        {
          kind: "navigable",
          label: "Supermercado",
          supportingLabel: "Hoy, 24 de julio · Billetera virtual",
          value: "24.300",
          valuePrefix: "-$",
          href: "/movimientos/1",
        },
        {
          kind: "navigable",
          label: "Sueldo",
          supportingLabel: "Ayer, 23 de julio · Banco principal",
          value: "310.000",
          valuePrefix: "+$",
          href: "/movimientos/2",
        },
      ],
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
    state: "complete",
  },
} satisfies NowViewModel;
