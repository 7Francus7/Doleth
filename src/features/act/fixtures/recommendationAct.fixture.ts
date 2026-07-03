import type { ActViewModel } from "../model";

export const recommendationActFixture = {
  navigation: {
    backHref: "/ahora",
    backLabel: "Ahora",
    title: "Actuar",
  },
  rail: {
    items: ["Desde Ahora", "Actualizado hace 2 min", "Información completa"],
    state: "complete",
    wrap: "truncate",
  },
  recommendation: {
    stateLabel: "Recomendación para hoy",
    conclusion: "Conviene cubrir tu Visa hoy",
    amount: {
      value: "57.820",
      prefix: "$",
      size: "xl",
      tone: "neutral",
      format: "currency",
      state: "confirmed",
    },
    consequence: "Dejás cubierto el vencimiento de mañana",
    confidenceLabel: "Información completa",
  },
} satisfies ActViewModel;
