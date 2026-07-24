import { incompleteAvailableEvidenceFixture } from "../evidence/fixtures";
import type { NowViewModel } from "../model";

// Información incompleta: hay cuentas, pero todavía no hay pagos cargados. La
// proyección no afirma que esté todo cubierto: dice qué está usando.
export const incompleteNowFixture = {
  rail: {
    items: ["Dinero en cuentas", "ARS", "Personal", "Información incompleta"],
    state: "partial",
    wrap: "truncate",
  },
  banner: null,
  hero: {
    scenario: "stable",
    stateText: "Esta lectura usa solamente lo que cargaste.",
    value: "428.500",
    valuePrefix: "$",
    valueLabel: "Dinero en tus cuentas",
    inlineNote: "No hay pagos próximos cargados.",
    coverage: {
      title: "Cobertura de lo comprometido",
      value: 100,
      leftSummary: "Sin pagos cargados",
      rightSummary: "$0",
      state: "stable",
      accessibleLabel: "Sin pagos próximos cargados.",
    },
  },
  evidence: incompleteAvailableEvidenceFixture,
  projection: {
    title: "Después de pagar",
    headline: "Sin pagos cargados, tu proyección coincide con el dinero actual.",
    amount: "428.500",
    amountPrefix: "$",
    amountState: "default",
    rows: [
      { label: "Dinero en tus cuentas", value: "428.500", valuePrefix: "$" },
      { label: "Comprometido", value: "0", valuePrefix: "$" },
      { label: "Quedarían", value: "428.500", valuePrefix: "$" },
    ],
    note: "Sin próximos pagos cargados hasta el domingo 23 de agosto.",
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
      { label: "Ingresos", value: "0", valuePrefix: "$" },
      { label: "Gastos", value: "0", valuePrefix: "$" },
      { label: "Diferencia", value: "0", valuePrefix: "$" },
    ],
  },
  accounts: [
    { id: "banco", name: "Banco principal", type: "Banco", balance: "300.000", balancePrefix: "$", state: "stable" },
    { id: "billetera", name: "Billetera virtual", type: "Billetera", balance: "128.500", balancePrefix: "$", state: "stable" },
  ],
  operational: [
    {
      title: "Próximos pagos",
      actionLabel: "Ver todos",
      actionHref: "/proximo",
      rows: [{ label: "No hay pagos próximos cargados", value: "0", valuePrefix: "$" }],
    },
    {
      title: "Movimientos recientes",
      actionLabel: "Ver historial",
      actionHref: "/movimientos",
      rows: [{ label: "Todavía no registraste movimientos", value: "0", valuePrefix: "$" }],
    },
  ],
  investments: null,
  information: {
    title: "De dónde sale esta lectura",
    primaryLine: "2 cuentas registradas; 0 pagos próximos considerados.",
    causalLine:
      "Los saldos se derivan del saldo inicial y del ledger, excluyendo movimientos anulados. Las transferencias entre tus cuentas no alteran el total.",
    linkLabel: "Ver movimientos",
    linkHref: "/movimientos",
    state: "partial",
  },
} satisfies NowViewModel;
