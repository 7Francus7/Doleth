import { validateEvidenceBreakdown, type EvidenceBreakdown } from "../../../evidence/model";

// Importes largos: sirve para verificar que el número principal y su desglose
// siguen siendo legibles en 320 px sin cortarse.
const largeAvailableEvidence = {
  status: "complete",
  title: "Cómo se calculó",
  subtitle: "Saldos de tus cuentas activas, hoy",
  summary: "Hay $12.498.850,75 comprometidos hasta el domingo 23 de agosto. La proyección resta esos compromisos del dinero en tus cuentas.",
  lines: [
    {
      id: "banco",
      label: "Banco principal",
      amount: 9_800_200.5,
      displayValue: "9.800.200,50",
      valuePrefix: "$",
    },
    {
      id: "ahorro",
      label: "Caja de ahorro",
      amount: 2_400_150.25,
      displayValue: "2.400.150,25",
      valuePrefix: "$",
    },
    {
      id: "efectivo",
      label: "Efectivo",
      amount: 280_000,
      displayValue: "280.000",
      valuePrefix: "$",
    },
  ],
  total: {
    label: "Dinero en tus cuentas",
    amount: 12_480_350.75,
    displayValue: "12.480.350,75",
    valuePrefix: "$",
  },
  metadata: ["Dinero en cuentas", "ARS", "Personal", "Información completa"],
} satisfies EvidenceBreakdown;

export const largeAvailableEvidenceFixture = validateEvidenceBreakdown(
  largeAvailableEvidence,
  "12.480.350,75",
);
