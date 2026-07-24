import { validateEvidenceBreakdown, type EvidenceBreakdown } from "../../../evidence/model";

// Lectura incompleta: una cuenta no pudo leerse. El total sigue visible, pero se
// declara parcial en vez de presentarse como cifra cerrada.
const incompleteAvailableEvidence = {
  status: "partial",
  title: "Cómo se calculó",
  subtitle: "Saldos de tus cuentas activas, hoy",
  summary: "No hay pagos próximos cargados, así que la proyección coincide con el dinero actual.",
  lines: [
    {
      id: "banco",
      label: "Banco principal",
      amount: 300_000,
      displayValue: "300.000",
      valuePrefix: "$",
      status: "confirmed",
    },
    {
      id: "billetera",
      label: "Billetera virtual",
      amount: 128_500,
      displayValue: "128.500",
      valuePrefix: "$",
      status: "confirmed",
    },
    {
      id: "efectivo",
      label: "Efectivo",
      amount: null,
      displayValue: "Sin confirmar",
      valuePrefix: "",
      status: "missing",
    },
  ],
  total: {
    label: "Dinero en tus cuentas",
    amount: 428_500,
    displayValue: "428.500",
    valuePrefix: "$",
  },
  metadata: ["Dinero en cuentas", "ARS", "Personal", "Información incompleta"],
} satisfies EvidenceBreakdown;

export const incompleteAvailableEvidenceFixture = validateEvidenceBreakdown(
  incompleteAvailableEvidence,
  "428.500",
);
