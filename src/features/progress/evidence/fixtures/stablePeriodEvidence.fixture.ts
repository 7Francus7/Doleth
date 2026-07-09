import { validateEvidenceBreakdown, type EvidenceBreakdown } from "../../../evidence/model";

const stablePeriodEvidence = {
  status: "complete",
  title: "Evidencia de la trayectoria",
  subtitle: "El movimiento del periodo se reconcilia con tres dimensiones",
  summary:
    "El periodo avanza por mas liquidez, menos deuda y valorizacion de inversiones ya conocidas.",
  lines: [
    {
      id: "liquidity",
      label: "Liquidez ganada en el periodo",
      amount: 34_000,
      displayValue: "34.000",
      valuePrefix: "$",
      sign: "+",
    },
    {
      id: "debt",
      label: "Deuda reducida en el periodo",
      amount: 21_500,
      displayValue: "21.500",
      valuePrefix: "$",
      sign: "+",
    },
    {
      id: "investments",
      label: "Valorizacion de inversiones",
      amount: 12_800,
      displayValue: "12.800",
      valuePrefix: "$",
      sign: "+",
    },
  ],
  total: {
    label: "Avance del periodo",
    amount: 68_300,
    displayValue: "68.300",
    valuePrefix: "$",
  },
  metadata: ["Periodo actual", "ARS", "Personal", "Informacion completa"],
} satisfies EvidenceBreakdown;

export const stablePeriodEvidenceFixture = validateEvidenceBreakdown(
  stablePeriodEvidence,
  "68.300",
);
