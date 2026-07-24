import { validateEvidenceBreakdown, type EvidenceBreakdown } from "../../../evidence/model";

// Con un pago vencido a la cabeza: sigue siendo un compromiso y encabeza el orden.
const attentionHorizonEvidence = {
  status: "complete",
  title: "Pagos pendientes",
  subtitle: "En orden de vencimiento",
  summary: "Con $80.000 en tus cuentas: después de estos pagos faltarían $16.000.",
  lines: [
    {
      id: "internet",
      label: "Internet · Ayer",
      amount: 18_500,
      displayValue: "18.500",
      valuePrefix: "$",
    },
    {
      id: "gimnasio",
      label: "Gimnasio · Hoy",
      amount: 19_500,
      displayValue: "19.500",
      valuePrefix: "$",
    },
    {
      id: "visa",
      label: "Tarjeta Visa · Viernes 31 de julio",
      amount: 46_000,
      displayValue: "46.000",
      valuePrefix: "$",
    },
    {
      id: "alquiler",
      label: "Alquiler · Sábado 1 de agosto",
      amount: 12_000,
      displayValue: "12.000",
      valuePrefix: "$",
    },
  ],
  total: {
    label: "Pendiente",
    amount: 96_000,
    displayValue: "96.000",
    valuePrefix: "$",
  },
  metadata: ["Próximos pagos", "ARS", "Personal", "Información completa"],
} satisfies EvidenceBreakdown;

export const attentionHorizonEvidenceFixture = validateEvidenceBreakdown(
  attentionHorizonEvidence,
  "96.000",
);
