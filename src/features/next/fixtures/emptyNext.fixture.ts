import type { NextViewModel } from "../model";

// Sin pagos cargados no hay error ni alarma: la proyección coincide con lo que
// ya hay, y la acción secundaria invita a anticiparse.
export const emptyNextFixture = {
  rail: {
    items: ["Próximos pagos", "ARS", "Personal", "Información completa"],
    state: "complete",
    wrap: "truncate",
  },
  banner: null,
  hero: {
    scenario: "new",
    stateText: "No hay pagos próximos cargados.",
    valueLabel: "Cargá un pago previsto para verlo con anticipación.",
  },
  evidence: null,
  coverage: null,
  stability: {
    children: "Sin pagos cargados, tu proyección coincide con el dinero que ya tenés.",
    container: "none",
    kind: "stable",
  },
  actions: {
    primary: "register",
    primaryLabel: "Agregar pago previsto",
    secondaryActions: [
      { id: "now", label: "Volver a Ahora" },
      { id: "history", label: "Ver movimientos" },
    ],
    state: "default",
  },
  timeline: [],
  empty: {
    title: "No hay pagos próximos cargados.",
    description: "Tu proyección coincide con el dinero actual. Agregá un pago previsto para anticiparte.",
    actionLabel: "Agregar pago previsto",
    actionHref: "/proximo/nuevo",
  },
  confirmed: null,
  information: {
    title: "Qué muestra esta pantalla",
    primaryLine: "0 pagos pendientes; 0 confirmados.",
    causalLine:
      "El saldo posterior descuenta solamente pagos pendientes, en orden de vencimiento. Confirmar un pago crea el movimiento una sola vez.",
    linkLabel: "Agregar pago previsto",
    linkHref: "/proximo/nuevo",
    state: "complete",
  },
  restorationKey: "/proximo",
} satisfies NextViewModel;
