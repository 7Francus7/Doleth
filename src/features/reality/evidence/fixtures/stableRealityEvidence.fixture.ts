import { validateRealityEvidence, type RealityEvidence } from "../model";

const stableRealityEvidence = {
  status: "complete",
  title: "Evidencia de la base patrimonial",
  subtitle: "La base se reconcilia con cinco dominios registrados",
  summary:
    "La base patrimonial visible hoy resulta de lo que aportan cuentas, inversiones y reservas, menos lo que comprometen tarjetas y deudas.",
  lines: [
    {
      id: "accounts",
      label: "Dinero en cuentas ya confirmado",
      amount: 412_000,
      displayValue: "412.000",
      valuePrefix: "$",
      sign: "+",
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
    label: "Base patrimonial visible",
    amount: 647_500,
    displayValue: "647.500",
    valuePrefix: "$",
  },
  metadata: ["Corte de hoy", "ARS", "Personal", "Informacion completa"],
} satisfies RealityEvidence;

export const stableRealityEvidenceFixture = validateRealityEvidence(
  stableRealityEvidence,
  "647.500",
);
