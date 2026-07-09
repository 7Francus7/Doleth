import { validateEvidenceBreakdown, type EvidenceBreakdown } from "../../../evidence/model";

const attentionHorizonEvidence = {
  status: "complete",
  title: "Cobertura de los proximos 7 dias",
  subtitle: "La prioridad principal esta aca",
  lines: [
    {
      id: "confirmed-income",
      label: "Cobro confirmado del miercoles",
      amount: 24_000,
      displayValue: "24.000",
      valuePrefix: "$",
      sign: "+",
    },
    {
      id: "rent",
      label: "Alquiler del jueves",
      amount: -96_000,
      displayValue: "96.000",
      valuePrefix: "$",
      sign: "-",
    },
    {
      id: "card-minimum",
      label: "Pago minimo de tarjeta",
      amount: -28_000,
      displayValue: "28.000",
      valuePrefix: "$",
      sign: "-",
    },
  ],
  total: {
    label: "Por cubrir en 7 dias",
    amount: -100_000,
    displayValue: "100.000",
    valuePrefix: "$",
  },
  metadata: ["Proximos 7 dias", "ARS", "Personal", "Informacion completa"],
} satisfies EvidenceBreakdown;

export const attentionHorizonEvidenceFixture = validateEvidenceBreakdown(
  attentionHorizonEvidence,
  "100.000",
);
