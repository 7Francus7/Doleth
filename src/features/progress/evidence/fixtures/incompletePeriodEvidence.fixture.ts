import { validateEvidenceBreakdown, type EvidenceBreakdown } from "../../../evidence/model";

const incompletePeriodEvidence = {
  status: "partial",
  title: "Evidencia de la trayectoria",
  subtitle: "Falta una valuacion al cierre para cerrar el periodo",
  summary:
    "La liquidez y la deuda ya estan reconciliadas. Las inversiones no tienen valuacion al cierre y no se suman hasta actualizarse.",
  lines: [
    {
      id: "liquidity",
      label: "Liquidez ganada en el periodo",
      amount: 18_700,
      displayValue: "18.700",
      valuePrefix: "$",
      sign: "+",
    },
    {
      id: "debt",
      label: "Deuda reducida en el periodo",
      amount: 7_500,
      displayValue: "7.500",
      valuePrefix: "$",
      sign: "+",
    },
    {
      id: "investments",
      label: "Inversiones sin valuacion al cierre",
      amount: null,
      displayValue: "Pendiente",
      valuePrefix: "$",
      status: "missing",
    },
  ],
  total: {
    label: "Avance conocido del periodo",
    amount: 26_200,
    displayValue: "26.200",
    valuePrefix: "$",
  },
  metadata: ["Periodo actual", "ARS", "Personal", "Informacion parcial"],
} satisfies EvidenceBreakdown;

export const incompletePeriodEvidenceFixture = validateEvidenceBreakdown(
  incompletePeriodEvidence,
  "26.200",
);
