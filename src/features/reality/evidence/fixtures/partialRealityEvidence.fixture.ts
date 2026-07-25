import { validateEvidenceBreakdown, type EvidenceBreakdown } from "../../../evidence/model";

// Representación parcial: una sola cuenta activa y un pago vencido sin confirmar.
// La evidencia sigue reconciliando; lo que falta se dice en las señales.
const partialRealityEvidence = {
  status: "complete",
  title: "Cómo se calculó tu patrimonio",
  subtitle:
    "Σ saldos de 1 cuenta; cada saldo es su saldo inicial más los movimientos no anulados",
  summary:
    "Fórmula: patrimonio = Σ saldos de cuentas activas + Σ saldos de cuentas archivadas. Compromisos: $41.800 en 1 pago pendiente, no restado porque todavía no ocurrió. De una corrección pesa solo el reemplazo: el original queda anulado en el ledger.",
  lines: [
    {
      id: "banco",
      label: "Banco · activa",
      amount: 128_400,
      displayValue: "128.400",
      valuePrefix: "$",
      sign: "+",
      status: "confirmed",
    },
  ],
  total: {
    label: "Patrimonio registrado",
    amount: 128_400,
    displayValue: "128.400",
    valuePrefix: "$",
  },
  metadata: ["Corte del 24 de julio", "ARS", "Personal", "Representación parcial"],
} satisfies EvidenceBreakdown;

export const partialRealityEvidenceFixture = validateEvidenceBreakdown(
  partialRealityEvidence,
  "128.400",
);
