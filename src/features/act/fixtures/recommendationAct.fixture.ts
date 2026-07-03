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
    conclusion: "Cubrir tarjeta Visa",
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
  reason: "Vence mañana y hoy faltan $57.820 para dejarla cubierta.",
  impact: {
    title: "Qué cambia",
    rows: [
      {
        label: "Si actuás",
        supportingLabel:
          "El compromiso queda cubierto y evitás llegar al vencimiento con faltante.",
        value: "Hoy",
        density: "compact",
      },
      {
        label: "Si esperás",
        supportingLabel: "Mañana vas a necesitar resolverlo con menos margen.",
        value: "Mañana",
        density: "compact",
      },
    ],
  },
  decision: {
    primaryLabel: "Continuar",
    secondaryActions: [
      { href: "/ahora#evidence", label: "Revisar datos" },
      { href: "/ahora", label: "Ahora no" },
    ],
  },
} satisfies ActViewModel;
