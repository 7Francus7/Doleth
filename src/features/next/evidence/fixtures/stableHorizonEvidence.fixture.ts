import { validateHorizonEvidence, type HorizonEvidence } from "../model";

const stableHorizonEvidence = {
  status: "complete",
  title: "Cobertura de los proximos 7 dias",
  subtitle: "Se calcula asi",
  lines: [
    {
      id: "confirmed-income",
      label: "Cobro confirmado",
      amount: 18_000,
      displayValue: "18.000",
      valuePrefix: "$",
      sign: "+",
    },
    {
      id: "card-payment",
      label: "Pago de tarjeta del jueves",
      amount: -31_500,
      displayValue: "31.500",
      valuePrefix: "$",
      sign: "-",
    },
    {
      id: "loan-fee",
      label: "Cuota automatica del sabado",
      amount: -26_320,
      displayValue: "26.320",
      valuePrefix: "$",
      sign: "-",
    },
  ],
  total: {
    label: "Por cubrir en 7 dias",
    amount: -39_820,
    displayValue: "39.820",
    valuePrefix: "$",
  },
  metadata: ["Proximos 7 dias", "ARS", "Personal", "Informacion completa"],
} satisfies HorizonEvidence;

export const stableHorizonEvidenceFixture = validateHorizonEvidence(
  stableHorizonEvidence,
  "39.820",
);
