import { validateChangeEvidence, type ChangeEvidence } from "../model";

const incompleteChangeEvidence = {
  status: "partial",
  title: "Evidencia del cambio actual",
  subtitle: "Falta un dato para cerrar la causalidad",
  summary:
    "Dos hechos ya explican la mayor parte del cambio visible, pero un cobro sigue sin confirmar su acreditacion.",
  lines: [
    {
      id: "salary-transfer",
      label: "Transferencia recibida ya visible",
      amount: 27_500,
      displayValue: "27.500",
      valuePrefix: "$",
      sign: "+",
    },
    {
      id: "service-bill",
      label: "Debito de servicios ya aplicado",
      amount: -9_300,
      displayValue: "9.300",
      valuePrefix: "$",
      sign: "-",
    },
    {
      id: "pending-collection",
      label: "Cobro relacionado todavia sin confirmar",
      amount: null,
      displayValue: "Pendiente",
      valuePrefix: "$",
      sign: "+",
      status: "missing",
    },
  ],
  total: {
    label: "Cambio neto conocido",
    amount: 18_200,
    displayValue: "18.200",
    valuePrefix: "$",
  },
  metadata: ["Ultimos 7 dias", "ARS", "Personal", "Informacion parcial"],
} satisfies ChangeEvidence;

export const incompleteChangeEvidenceFixture = validateChangeEvidence(
  incompleteChangeEvidence,
  "18.200",
);
