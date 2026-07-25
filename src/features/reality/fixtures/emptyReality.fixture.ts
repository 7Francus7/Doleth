import type { RealityViewModel } from "../model";

/** Sin cuentas: no hay patrimonio ni composición que mostrar. */
export const emptyRealityFixture = {
  rail: {
    items: ["Corte del 24 de julio", "ARS", "Personal", "Sin base registrada"],
    state: "partial",
    wrap: "truncate",
  },
  banner: null,
  hero: {
    scenario: "new",
    stateText: "Tu realidad financiera todavía está vacía.",
    valueLabel: "Creá una cuenta para empezar a representar dónde está tu dinero.",
  },
  evidence: null,
  synthesis: "Creá una cuenta para empezar a representar dónde está tu dinero.",
  sections: [],
  stability: {
    children: "Creá tu primera cuenta para empezar a representar tu realidad.",
    container: "none",
    kind: "neutral",
  },
  primaryAction: null,
  quality: null,
  missing: {
    title: "Falta tu base financiera",
    primaryLine: "Sin cuentas registradas no hay patrimonio ni composición para mostrar.",
    causalLine: "Creá al menos una cuenta con su saldo inicial para habilitar esta pantalla.",
    linkLabel: "Crear cuenta",
    linkHref: "/cuentas/nueva",
    state: "partial",
  },
  information: {
    title: "De dónde sale esta composición",
    primaryLine: "No usa saldos editables, estimaciones ni cifras simuladas.",
    causalLine:
      "El patrimonio se deriva del saldo inicial de cada cuenta y del ledger, excluyendo movimientos anulados. Las inversiones y los compromisos se contabilizan por separado y se declaran como tales.",
    linkLabel: "Ver cuentas",
    linkHref: "/cuentas",
    state: "partial",
  },
} satisfies RealityViewModel;
