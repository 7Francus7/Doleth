import { validateEvidenceBreakdown, type EvidenceBreakdown } from "../../../evidence/model";

const incompleteAvailableEvidence = {
  status: "partial",
  title: "Disponible",
  subtitle: "Último valor conocido · faltan datos para recalcular",
  lines: [
    {
      id: "main-balance",
      label: "Saldo principal",
      amount: null,
      displayValue: "Sin confirmar",
      valuePrefix: "",
      status: "missing",
    },
    {
      id: "reserves",
      label: "Reservas confirmadas",
      amount: -120_000,
      displayValue: "120.000",
      valuePrefix: "$",
      sign: "-",
      status: "confirmed",
    },
    {
      id: "upcoming-payments",
      label: "Pagos próximos confirmados",
      amount: -57_820,
      displayValue: "57.820",
      valuePrefix: "$",
      sign: "-",
      status: "confirmed",
    },
  ],
  total: {
    label: "Disponible · valor parcial",
    amount: 432_180,
    displayValue: "432.180",
    valuePrefix: "$",
  },
  metadata: ["Último valor hace 19 h", "ARS", "Personal", "Información parcial"],
} satisfies EvidenceBreakdown;

export const incompleteAvailableEvidenceFixture = validateEvidenceBreakdown(
  incompleteAvailableEvidence,
  "432.180",
);
