import { validateChangeEvidence, type ChangeEvidence } from "../model";

const stableChangeEvidence = {
  status: "complete",
  title: "Evidencia del cambio actual",
  subtitle: "La lectura actual queda explicada por tres hechos",
  summary:
    "La situacion actual hoy esta mas arriba porque ya se acreditaron ingresos y ya se aplicaron egresos visibles.",
  lines: [
    {
      id: "client-payment",
      label: "Cobro de cliente ya acreditado",
      amount: 58_000,
      displayValue: "58.000",
      valuePrefix: "$",
      sign: "+",
    },
    {
      id: "card-payment",
      label: "Pago de tarjeta ya debitado",
      amount: -21_500,
      displayValue: "21.500",
      valuePrefix: "$",
      sign: "-",
    },
    {
      id: "cash-adjustment",
      label: "Ajuste de efectivo ya registrado",
      amount: -5_000,
      displayValue: "5.000",
      valuePrefix: "$",
      sign: "-",
    },
  ],
  total: {
    label: "Cambio neto visible hoy",
    amount: 31_500,
    displayValue: "31.500",
    valuePrefix: "$",
  },
  metadata: ["Ultimos 7 dias", "ARS", "Personal", "Informacion completa"],
} satisfies ChangeEvidence;

export const stableChangeEvidenceFixture = validateChangeEvidence(
  stableChangeEvidence,
  "31.500",
);
