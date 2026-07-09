import { validateEvidenceBreakdown, type EvidenceBreakdown } from "../../../evidence/model";

const attentionRealityEvidence = {
  status: "partial",
  title: "Evidencia de la base patrimonial",
  subtitle: "Una cuenta en conflicto deja la base abierta",
  summary:
    "Cuatro dominios ya estan confirmados. El saldo registrado de la cuenta principal no coincide con su ultima referencia y no se suma hasta confirmarse.",
  lines: [
    {
      id: "accounts",
      label: "Dinero en cuentas con saldo en conflicto",
      amount: null,
      displayValue: "En revision",
      valuePrefix: "$",
      status: "missing",
    },
    {
      id: "cards",
      label: "Consumo financiado de tarjetas",
      amount: -96_500,
      displayValue: "96.500",
      valuePrefix: "$",
      sign: "-",
    },
    {
      id: "debts",
      label: "Neto entre deudas y cobros",
      amount: -48_000,
      displayValue: "48.000",
      valuePrefix: "$",
      sign: "-",
    },
    {
      id: "investments",
      label: "Inversiones con valuacion vigente",
      amount: 305_000,
      displayValue: "305.000",
      valuePrefix: "$",
      sign: "+",
    },
    {
      id: "reserves",
      label: "Dinero reservado con proposito",
      amount: 75_000,
      displayValue: "75.000",
      valuePrefix: "$",
      sign: "+",
    },
  ],
  total: {
    label: "Base confirmada hoy",
    amount: 235_500,
    displayValue: "235.500",
    valuePrefix: "$",
  },
  metadata: ["Corte de hoy", "ARS", "Personal", "Informacion parcial"],
} satisfies EvidenceBreakdown;

export const attentionRealityEvidenceFixture = validateEvidenceBreakdown(
  attentionRealityEvidence,
  "235.500",
);
