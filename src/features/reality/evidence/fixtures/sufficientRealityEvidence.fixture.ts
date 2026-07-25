import { validateEvidenceBreakdown, type EvidenceBreakdown } from "../../../evidence/model";

// El patrimonio se reconcilia con los saldos de las cuentas: nada más entra al
// total. Inversiones y compromisos se nombran en el resumen, no en las líneas.
const sufficientRealityEvidence = {
  status: "complete",
  title: "Cómo se calculó tu patrimonio",
  subtitle:
    "Σ saldos de 3 cuentas; cada saldo es su saldo inicial más los movimientos no anulados",
  summary:
    "Fórmula: patrimonio = Σ saldos de cuentas activas + Σ saldos de cuentas archivadas. Inversiones: $305.000 en 2 posiciones, fuera del patrimonio en cuentas porque no tienen cuenta que las respalde. Compromisos: $124.400 en 3 pagos pendientes, no restados porque todavía no ocurrieron. Transferencias del mes: $50.000 con efecto patrimonial cero. Movimientos anulados del mes: 1, sin efecto sobre ninguna cifra. De una corrección pesa solo el reemplazo: el original queda anulado en el ledger.",
  lines: [
    {
      id: "banco",
      label: "Banco · activa",
      amount: 412_000,
      displayValue: "412.000",
      valuePrefix: "$",
      sign: "+",
      status: "confirmed",
    },
    {
      id: "efectivo",
      label: "Efectivo · activa",
      amount: 86_500,
      displayValue: "86.500",
      valuePrefix: "$",
      sign: "+",
      status: "confirmed",
    },
    {
      id: "vieja",
      label: "Cuenta vieja · archivada",
      amount: 40_000,
      displayValue: "40.000",
      valuePrefix: "$",
      sign: "+",
      status: "confirmed",
    },
  ],
  total: {
    label: "Patrimonio registrado",
    amount: 538_500,
    displayValue: "538.500",
    valuePrefix: "$",
  },
  metadata: ["Corte del 24 de julio", "ARS", "Personal", "Completa para análisis"],
} satisfies EvidenceBreakdown;

export const sufficientRealityEvidenceFixture = validateEvidenceBreakdown(
  sufficientRealityEvidence,
  "538.500",
);
