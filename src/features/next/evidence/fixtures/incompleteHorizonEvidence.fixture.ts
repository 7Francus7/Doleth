import { validateEvidenceBreakdown, type EvidenceBreakdown } from "../../../evidence/model";

const incompleteHorizonEvidence = {
  status: "partial",
  title: "Cobertura conocida de los proximos 7 dias",
  subtitle: "Falta un dato material para cerrarla",
  lines: [
    {
      id: "confirmed-income",
      label: "Cobro confirmado del viernes",
      amount: 22_000,
      displayValue: "22.000",
      valuePrefix: "$",
      sign: "+",
    },
    {
      id: "service-bill",
      label: "Vencimiento de servicios",
      amount: -18_500,
      displayValue: "18.500",
      valuePrefix: "$",
      sign: "-",
    },
    {
      id: "card-close",
      label: "Cierre de tarjeta sin confirmar",
      amount: null,
      displayValue: "Pendiente",
      valuePrefix: "$",
      sign: "-",
      status: "missing",
    },
  ],
  total: {
    label: "Compromisos conocidos",
    amount: 3_500,
    displayValue: "3.500",
    valuePrefix: "$",
  },
  metadata: ["Proximos 7 dias", "ARS", "Personal", "Informacion parcial"],
} satisfies EvidenceBreakdown;

export const incompleteHorizonEvidenceFixture = validateEvidenceBreakdown(
  incompleteHorizonEvidence,
  "3.500",
);
