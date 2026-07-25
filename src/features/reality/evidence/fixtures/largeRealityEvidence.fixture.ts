import { validateEvidenceBreakdown, type EvidenceBreakdown } from "../../../evidence/model";

// Importes grandes: sirve para verificar que nada se desborda en 320 px y que el
// agrupador de miles se lee igual en millones que en cientos.
const largeRealityEvidence = {
  status: "complete",
  title: "Cómo se calculó tu patrimonio",
  subtitle:
    "Σ saldos de 2 cuentas; cada saldo es su saldo inicial más los movimientos no anulados",
  summary:
    "Fórmula: patrimonio = Σ saldos de cuentas activas + Σ saldos de cuentas archivadas. Inversiones: $48.900.000 en 3 posiciones, fuera del patrimonio en cuentas porque no tienen cuenta que las respalde. De una corrección pesa solo el reemplazo: el original queda anulado en el ledger.",
  lines: [
    {
      id: "banco",
      label: "Banco principal · activa",
      amount: 128_450_300,
      displayValue: "128.450.300",
      valuePrefix: "$",
      sign: "+",
      status: "confirmed",
    },
    {
      id: "inversion",
      label: "Caja de ahorro · activa",
      amount: 17_480_300,
      displayValue: "17.480.300",
      valuePrefix: "$",
      sign: "+",
      status: "confirmed",
    },
  ],
  total: {
    label: "Patrimonio registrado",
    amount: 145_930_600,
    displayValue: "145.930.600",
    valuePrefix: "$",
  },
  metadata: ["Corte del 24 de julio", "ARS", "Personal", "Completa para análisis"],
} satisfies EvidenceBreakdown;

export const largeRealityEvidenceFixture = validateEvidenceBreakdown(
  largeRealityEvidence,
  "145.930.600",
);
