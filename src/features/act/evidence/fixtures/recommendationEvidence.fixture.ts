import {
  type RecommendationEvidence,
  validateRecommendationEvidence,
} from "../model";

const recommendationEvidence = {
  title: "Por qué conviene cubrir Visa",
  subtitle: "La recomendación se apoya en estos datos.",
  priorityLabel: "Por qué es prioridad",
  priorityReason: "Es el único compromiso que vence mañana sin cobertura asignada.",
  lines: [
    {
      id: "visa-due",
      label: "Vencimiento Visa",
      amount: 57_820,
      displayValue: "57.820",
      valuePrefix: "$",
    },
    {
      id: "assigned-coverage",
      label: "Cobertura asignada",
      amount: 0,
      displayValue: "0",
      valuePrefix: "$",
    },
  ],
  missing: {
    id: "missing-amount",
    label: "Importe faltante",
    amount: 57_820,
    displayValue: "57.820",
    valuePrefix: "$",
  },
  dateLabel: "Fecha que importa",
  dateValue: "Vence mañana",
  waitLabel: "Si esperás",
  waitConsequence: "Mañana vas a necesitar resolver el mismo faltante con menos margen.",
} satisfies RecommendationEvidence;

export const recommendationEvidenceFixture = validateRecommendationEvidence(
  recommendationEvidence,
  "57.820",
);
