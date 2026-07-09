import { validateEvidenceBreakdown, type EvidenceBreakdown } from "../../../evidence/model";

const incompleteRealityEvidence = {
  status: "partial",
  title: "Evidencia de la base patrimonial",
  subtitle: "Falta una valuacion vigente para cerrar la base",
  summary:
    "Cuatro dominios ya estan confirmados. Las inversiones tienen una ultima valuacion vencida y no se suman hasta actualizarse.",
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
      label: "Inversiones sin valuacion vigente",
      amount: null,
      displayValue: "Pendiente",
      valuePrefix: "$",
      status: "missing",
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
    label: "Base conocida hoy",
    amount: 342_500,
    displayValue: "342.500",
    valuePrefix: "$",
  },
  metadata: ["Corte de hoy", "ARS", "Personal", "Informacion parcial"],
} satisfies EvidenceBreakdown;

export const incompleteRealityEvidenceFixture = validateEvidenceBreakdown(
  incompleteRealityEvidence,
  "342.500",
);
