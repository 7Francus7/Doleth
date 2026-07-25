import type { ChangesViewModel } from "../model";

/** Sin cuentas no hay patrimonio ni período anterior: no hay cambio que leer. */
export const emptyChangesFixture = {
  rail: {
    items: ["Últimos 7 días", "ARS", "Personal", "Comparación parcial"],
    state: "partial",
    wrap: "truncate",
  },
  banner: null,
  hero: {
    scenario: "new",
    stateText: "Todavía no hay una base para leer cambios.",
    valueLabel: "Creá una cuenta con su saldo real para empezar a leer cambios.",
  },
  evidence: null,
  comparison: {
    title: "Período comparado",
    supportingLine:
      "del viernes 18 al jueves 24 de julio contra del viernes 11 al jueves 17 de julio",
    rows: [
      { label: "Patrimonio al inicio", supportingLabel: "Viernes 18 de julio", value: "0", valuePrefix: "$" },
      { label: "Patrimonio hoy", supportingLabel: "Hoy", value: "0", valuePrefix: "$" },
      {
        kind: "with-status",
        label: "Diferencia",
        supportingLabel: "Sin porcentaje válido",
        status: "Sin base",
        value: "0",
        valuePrefix: "$",
        state: "default",
      },
      {
        label: "Mismo período anterior (7 días)",
        supportingLabel: "Sin movimientos registrados",
        value: "0",
        valuePrefix: "$",
      },
    ],
    summary:
      "Sin cuentas registradas no hay patrimonio ni período anterior contra el cual comparar.",
    summaryKind: "neutral",
  },
  causes: null,
  transfers: null,
  notice: null,
  stability: {
    children: "Creá tu primera cuenta con su saldo real para empezar a leer cambios.",
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
  missing: {
    title: "Falta tu base financiera",
    primaryLine: "Sin cuentas registradas no hay patrimonio ni lectura previa para comparar.",
    causalLine: "Creá al menos una cuenta con su saldo inicial para habilitar esta lectura.",
    linkLabel: "Crear cuenta",
    linkHref: "/cuentas/nueva",
    state: "partial",
  },
  information: {
    title: "De dónde sale esta lectura",
    primaryLine: "0 movimientos considerados del viernes 18 al jueves 24 de julio; 0 en el período anterior.",
    causalLine:
      "El cambio se deriva del ledger real: movimientos no anulados, sin transferencias internas y sin contar dos veces una corrección.",
    linkLabel: "Ver movimientos",
    linkHref: "/movimientos",
    state: "partial",
  },
} satisfies ChangesViewModel;
