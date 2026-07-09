import { validateEvidenceBreakdown, type EvidenceBreakdown } from "../../../evidence/model";

const attentionPeriodEvidence = {
  status: "partial",
  title: "Evidencia de la trayectoria",
  subtitle: "Una deuda sin cierre confirmado domina el retroceso",
  summary:
    "La liquidez y las inversiones avanzaron, pero una deuda nueva sin cierre confirmado domina el movimiento del periodo.",
  lines: [
    {
      id: "liquidity",
      label: "Liquidez ganada en el periodo",
      amount: 12_500,
      displayValue: "12.500",
      valuePrefix: "$",
      sign: "+",
    },
    {
      id: "investments",
      label: "Valorizacion de inversiones",
      amount: 8_200,
      displayValue: "8.200",
      valuePrefix: "$",
      sign: "+",
    },
    {
      id: "debt",
      label: "Deuda nueva sin cierre confirmado",
      amount: null,
      displayValue: "En revision",
      valuePrefix: "$",
      sign: "-",
      status: "missing",
    },
  ],
  total: {
    label: "Retroceso visible del periodo",
    amount: -73_300,
    displayValue: "73.300",
    valuePrefix: "$",
  },
  metadata: ["Periodo actual", "ARS", "Personal", "Informacion parcial"],
} satisfies EvidenceBreakdown;

export const attentionPeriodEvidenceFixture = validateEvidenceBreakdown(
  attentionPeriodEvidence,
  "73.300",
);
