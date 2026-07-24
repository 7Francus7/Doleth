import { validateEvidenceBreakdown, type EvidenceBreakdown } from "../../../evidence/model";

// El desglose son los pagos pendientes en orden de vencimiento: el mismo orden
// con el que se calcula el saldo posterior de cada uno.
const stableHorizonEvidence = {
  status: "complete",
  title: "Pagos pendientes",
  subtitle: "En orden de vencimiento",
  summary: "Con $428.500 en tus cuentas: después de estos pagos quedarían aproximadamente $332.500.",
  lines: [
    {
      id: "gimnasio",
      label: "Gimnasio · Hoy",
      amount: 19_500,
      displayValue: "19.500",
      valuePrefix: "$",
    },
    {
      id: "internet",
      label: "Internet · Mañana",
      amount: 18_500,
      displayValue: "18.500",
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

export const stableHorizonEvidenceFixture = validateEvidenceBreakdown(
  stableHorizonEvidence,
  "96.000",
);
