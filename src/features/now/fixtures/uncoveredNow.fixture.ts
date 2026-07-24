import type { NowViewModel } from "../model";
import { largeAvailableEvidenceFixture } from "../evidence/fixtures";

// Cobertura insuficiente con importes largos: el faltante se dice en pesos, sin
// mensajes alarmistas y sin culpabilizar.
export const uncoveredNowFixture = {
  rail: {
    items: ["Dinero en cuentas", "ARS", "Personal", "Información completa"],
    state: "complete",
    wrap: "truncate",
  },
  banner: null,
  hero: {
    scenario: "attention",
    stateText: "Los pagos cargados superan el dinero de tus cuentas.",
    value: "12.480.350,75",
    valuePrefix: "$",
    valueLabel: "Dinero en tus cuentas",
    inlineNote: "Hay $12.498.850,75 comprometidos hasta el domingo 23 de agosto.",
    coverage: {
      title: "Cobertura de lo comprometido",
      value: 99,
      leftSummary: "Faltan $18.500",
      rightSummary: "$12.498.850,75",
      state: "atRisk",
      accessibleLabel: "Cobertura: $12.480.350,75 cubiertos de $12.498.850,75 comprometidos.",
    },
  },
  evidence: largeAvailableEvidenceFixture,
  projection: {
    title: "Después de pagar",
    headline: "Después de los pagos cargados quedarían aproximadamente -$18.500.",
    amount: "18.500",
    amountPrefix: "-$",
    amountState: "attention",
    rows: [
      { label: "Dinero en tus cuentas", value: "12.480.350,75", valuePrefix: "$" },
      { label: "Comprometido", value: "12.498.850,75", valuePrefix: "-$" },
      { label: "Quedarían", value: "18.500", valuePrefix: "-$", state: "attention" },
    ],
    note: "Incluye 7 pagos cargados con vencimiento hasta el domingo 23 de agosto. Los importes de próximos pagos son previstos, así que el resultado es aproximado.",
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
      { label: "Ingresos", value: "8.420.000", valuePrefix: "$" },
      { label: "Gastos", value: "9.115.480,30", valuePrefix: "$" },
      { label: "Diferencia", value: "695.480,30", valuePrefix: "-$", state: "attention" },
    ],
  },
  accounts: [
    { id: "banco", name: "Banco principal", type: "Banco", balance: "9.800.200,50", balancePrefix: "$", state: "stable" },
    { id: "ahorro", name: "Caja de ahorro", type: "Ahorro", balance: "2.400.150,25", balancePrefix: "$", state: "stable" },
    { id: "efectivo", name: "Efectivo", type: "Efectivo", balance: "280.000", balancePrefix: "$", state: "stable" },
  ],
  operational: [
    {
      title: "Próximos pagos",
      actionLabel: "Ver todos",
      actionHref: "/proximo",
      rows: [
        {
          kind: "navigable",
          label: "Cuota del crédito hipotecario",
          supportingLabel: "Mañana · Banco principal",
          value: "9.480.000",
          valuePrefix: "$",
          href: "/proximo/hipoteca",
        },
        {
          kind: "navigable",
          label: "Tarjeta Visa",
          supportingLabel: "Viernes 31 de julio · Banco principal",
          value: "2.746.350,75",
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
          label: "Sueldo",
          supportingLabel: "Hoy, 24 de julio · Banco principal",
          value: "8.420.000",
          valuePrefix: "+$",
          href: "/movimientos/1",
        },
      ],
    },
  ],
  investments: null,
  information: {
    title: "De dónde sale esta lectura",
    primaryLine: "3 cuentas registradas; 7 pagos próximos considerados.",
    causalLine:
      "Los saldos se derivan del saldo inicial y del ledger, excluyendo movimientos anulados. Las transferencias entre tus cuentas no alteran el total.",
    linkLabel: "Ver movimientos",
    linkHref: "/movimientos",
    state: "complete",
  },
} satisfies NowViewModel;
