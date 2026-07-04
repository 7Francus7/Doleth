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
    label: "Que haces",
    helper: "Nada se mueve todavia.",
    primaryActionLabel: "Revisar y confirmar",
    confirmation: {
      label: "Antes de confirmar",
      helper: "Chequea solo lo necesario. Todavia no se movio dinero.",
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
        { label: "Efecto esperado", value: "Disponible despues: $374.360" },
      ],
      primaryActionLabel: "Confirmar para hoy",
      secondaryActionLabel: "Volver",
    },
    completion: {
      label: "Anotado",
      title: "Cubrir tarjeta Visa queda marcado para hoy.",
      detail: "No hubo movimiento real.",
      control: "Podes deshacerlo o cerrar.",
      undoLabel: "Deshacer",
      closeLabel: "Cerrar",
    },
    secondaryActions: [
      { id: "deferred", label: "Dejar para despues" },
      { id: "dismissed", label: "No insistir con esto" },
    ],
    outcomes: {
      deferred: {
        label: "La dejamos para despues",
        title: "Queda en pausa.",
        detail: "La retomas cuando tengas margen.",
        resetLabel: "Retomar",
      },
      dismissed: {
        label: "No insistimos con esta",
        title: "Deja de aparecer por ahora.",
        detail: "Si cambia el monto o el vencimiento, puede volver.",
        resetLabel: "Volver a verla",
      },
    },
  },
} satisfies ActViewModel;
