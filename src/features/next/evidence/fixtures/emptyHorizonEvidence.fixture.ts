import { validateEvidenceBreakdown, type EvidenceBreakdown } from "../../../evidence/model";

const emptyHorizonEvidence = {
  status: "complete",
  title: "Cobertura de los proximos 7 dias",
  subtitle: "No hay hechos materiales en este horizonte",
  lines: [],
  total: {
    label: "Por cubrir en 7 dias",
    amount: 0,
    displayValue: "0",
    valuePrefix: "$",
  },
  metadata: ["Proximos 7 dias", "ARS", "Personal", "Informacion completa"],
} satisfies EvidenceBreakdown;

export const emptyHorizonEvidenceFixture = validateEvidenceBreakdown(emptyHorizonEvidence, "0");
