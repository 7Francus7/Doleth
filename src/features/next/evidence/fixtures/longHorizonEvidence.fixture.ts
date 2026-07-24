import { validateEvidenceBreakdown, type EvidenceBreakdown } from "../../../evidence/model";

// Línea temporal larga: sirve para verificar que el desglose sigue legible y que
// el orden cronológico se mantiene a través de varios meses.
const longHorizonEvidence = {
  status: "complete",
  title: "Pagos pendientes",
  subtitle: "En orden de vencimiento",
  summary: "Con $300.000 en tus cuentas: después de estos pagos faltarían $18.000.",
  lines: [
    { id: "internet", label: "Internet · Ayer", amount: 18_500, displayValue: "18.500", valuePrefix: "$" },
    { id: "gimnasio", label: "Gimnasio · Hoy", amount: 19_500, displayValue: "19.500", valuePrefix: "$" },
    { id: "agua", label: "Agua · Mañana", amount: 9_800, displayValue: "9.800", valuePrefix: "$" },
    { id: "gas", label: "Gas · Lunes 27 de julio", amount: 14_200, displayValue: "14.200", valuePrefix: "$" },
    { id: "visa", label: "Tarjeta Visa · Viernes 31 de julio", amount: 46_000, displayValue: "46.000", valuePrefix: "$" },
    { id: "alquiler", label: "Alquiler · Sábado 1 de agosto", amount: 120_000, displayValue: "120.000", valuePrefix: "$" },
    { id: "colegio", label: "Cuota del colegio · Lunes 10 de agosto", amount: 58_000, displayValue: "58.000", valuePrefix: "$" },
    { id: "seguro", label: "Seguro del auto · Martes 15 de septiembre", amount: 32_000, displayValue: "32.000", valuePrefix: "$" },
  ],
  total: {
    label: "Pendiente",
    amount: 318_000,
    displayValue: "318.000",
    valuePrefix: "$",
  },
  metadata: ["Próximos pagos", "ARS", "Personal", "Información completa"],
} satisfies EvidenceBreakdown;

export const longHorizonEvidenceFixture = validateEvidenceBreakdown(
  longHorizonEvidence,
  "318.000",
);
