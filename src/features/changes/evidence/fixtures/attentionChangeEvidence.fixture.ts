import { validateEvidenceBreakdown, type EvidenceBreakdown } from "../../../evidence/model";

const attentionChangeEvidence = {
  status: "partial",
  title: "Evidencia del cambio actual",
  subtitle: "Un ajuste dominante sigue abierto",
  summary:
    "La lectura actual hoy esta mas baja, pero el ajuste dominante todavia necesita confirmacion.",
  lines: [
    {
      id: "service-payment",
      label: "Pago de servicio ya debitado",
      amount: -18_000,
      displayValue: "18.000",
      valuePrefix: "$",
      sign: "-",
    },
    {
      id: "manual-adjustment",
      label: "Ajuste manual de cuenta sin confirmar",
      amount: null,
      displayValue: "Pendiente",
      valuePrefix: "$",
      sign: "-",
      status: "missing",
    },
  ],
  total: {
    label: "Impacto visible hoy",
    amount: -84_000,
    displayValue: "84.000",
    valuePrefix: "$",
  },
  metadata: ["Ultimos 7 dias", "ARS", "Personal", "Informacion parcial"],
} satisfies EvidenceBreakdown;

export const attentionChangeEvidenceFixture = validateEvidenceBreakdown(
  attentionChangeEvidence,
  "84.000",
);
