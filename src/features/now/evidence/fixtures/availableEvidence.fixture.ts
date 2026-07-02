import { validateEvidenceBreakdown, type EvidenceBreakdown } from "../model";

const availableEvidence = {
  status: "complete",
  title: "Disponible",
  subtitle: "Se calcula así",
  lines: [
    {
      id: "liquid",
      label: "Saldo líquido confirmado",
      amount: 610_000,
      displayValue: "610.000",
      valuePrefix: "$",
    },
    {
      id: "reserves",
      label: "Reservas",
      amount: -120_000,
      displayValue: "120.000",
      valuePrefix: "$",
      sign: "-",
    },
    {
      id: "upcoming-payments",
      label: "Pagos próximos",
      amount: -57_820,
      displayValue: "57.820",
      valuePrefix: "$",
      sign: "-",
    },
  ],
  total: {
    label: "Disponible",
    amount: 432_180,
    displayValue: "432.180",
    valuePrefix: "$",
  },
  metadata: ["Actualizado hace 2 min", "ARS", "Personal", "Información completa"],
} satisfies EvidenceBreakdown;

export const availableEvidenceFixture = validateEvidenceBreakdown(
  availableEvidence,
  "432.180",
);
