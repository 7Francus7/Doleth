import { validateEvidenceBreakdown, type EvidenceBreakdown } from "../../../evidence/model";

// El desglose reconcilia con el número visible del Hero: son las cuentas activas
// y nada más. Los compromisos no se restan acá porque todavía no salieron.
const availableEvidence = {
  status: "complete",
  title: "Cómo se calculó",
  subtitle: "Saldos de tus cuentas activas, hoy",
  summary: "Hay $96.000 comprometidos hasta el domingo 23 de agosto. La proyección resta esos compromisos del dinero en tus cuentas.",
  lines: [
    {
      id: "banco",
      label: "Banco principal",
      amount: 300_000,
      displayValue: "300.000",
      valuePrefix: "$",
    },
    {
      id: "billetera",
      label: "Billetera virtual",
      amount: 96_500,
      displayValue: "96.500",
      valuePrefix: "$",
    },
    {
      id: "efectivo",
      label: "Efectivo",
      amount: 32_000,
      displayValue: "32.000",
      valuePrefix: "$",
    },
  ],
  total: {
    label: "Dinero en tus cuentas",
    amount: 428_500,
    displayValue: "428.500",
    valuePrefix: "$",
  },
  metadata: ["Dinero en cuentas", "ARS", "Personal", "Información completa"],
} satisfies EvidenceBreakdown;

export const availableEvidenceFixture = validateEvidenceBreakdown(
  availableEvidence,
  "428.500",
);
