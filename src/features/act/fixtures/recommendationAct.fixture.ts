import type { ActViewModel } from "../model";
import { recommendationEvidenceFixture } from "../evidence/fixtures";

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
    evidenceTriggerLabel: "Ver por qué",
  },
  evidence: recommendationEvidenceFixture,
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
    label: "Tu decision",
    helper: "Elegis que hacer con esta sugerencia. Todavia no se mueve dinero.",
    primaryActionLabel: "Aplicar recomendacion",
    confirmation: {
      label: "Listo para confirmar",
      helper: "Todavia no se movio dinero. Revisa estos datos antes de confirmar.",
      amountLabel: "Importe",
      amount: {
        value: "57.820",
        prefix: "$",
        size: "lg",
        tone: "neutral",
        format: "currency",
        state: "confirmed",
      },
      details: [
        { label: "Origen", value: "Cuenta principal" },
        { label: "Destino", value: "Visa terminada en 1842" },
        { label: "Fecha", value: "Hoy" },
        { label: "Efecto esperado", value: "Disponible despues: $374.360" },
        { label: "Reversibilidad", value: "No reversible una vez confirmado" },
      ],
      primaryActionLabel: "Confirmar",
      secondaryActionLabel: "Volver",
    },
    completion: {
      label: "Recomendacion preparada",
      title: "Cubrir tarjeta Visa queda preparada en esta vista.",
      detail: "Todavia no hubo movimiento real.",
      control: "Cuando exista ejecucion, la vas a continuar desde este mismo flujo. Podes deshacer o cerrar ahora.",
      undoLabel: "Deshacer",
      closeLabel: "Cerrar",
    },
    secondaryActions: [
      { id: "deferred", label: "Dejar para despues" },
      { id: "dismissed", label: "No sugerir de nuevo" },
    ],
    outcomes: {
      deferred: {
        label: "La dejamos para despues",
        title: "La sugerencia queda en pausa.",
        detail: "Podes retomarla desde Actuar cuando tengas margen para decidir sin apuro.",
        resetLabel: "Retomar ahora",
      },
      dismissed: {
        label: "No la vamos a insistir",
        title: "Esta sugerencia deja de aparecer en este estado.",
        detail:
          "Si cambian el vencimiento, el faltante o la cobertura, Doleth puede recalcularla otra vez.",
        resetLabel: "Volver a sugerirla",
      },
    },
  },
} satisfies ActViewModel;
