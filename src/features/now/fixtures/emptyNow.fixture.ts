import type { NowViewModel } from "../model";

// Sin cuentas no hay lectura financiera posible: se pide la base, no se finge un
// número. Una sola acción principal.
export const emptyNowFixture = {
  rail: {
    items: ["Dinero en cuentas", "ARS", "Personal", "Información incompleta"],
    state: "partial",
    wrap: "truncate",
  },
  banner: null,
  hero: {
    scenario: "new",
    stateText: "Empezá por representar dónde está tu dinero.",
    valueLabel: "Creá una cuenta para que Doleth pueda mostrar tu situación actual.",
  },
  evidence: null,
  projection: null,
  stability: {
    children: "Sin cuentas todavía no hay una lectura financiera que mostrar.",
    container: "none",
    kind: "neutral",
  },
  actions: {
    primary: "add-first-account",
    primaryLabel: "Crear una cuenta",
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
  accounts: [],
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
    primaryLine: "Todavía no hay cuentas registradas.",
    causalLine:
      "Los saldos se derivan del saldo inicial y del ledger, excluyendo movimientos anulados. Las transferencias entre tus cuentas no alteran el total.",
    linkLabel: "Ver movimientos",
    linkHref: "/movimientos",
    state: "partial",
  },
} satisfies NowViewModel;
