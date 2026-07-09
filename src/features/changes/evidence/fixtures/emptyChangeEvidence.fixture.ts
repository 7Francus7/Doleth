import { validateChangeEvidence, type ChangeEvidence } from "../model";

const emptyChangeEvidence = {
  status: "complete",
  title: "Evidencia del cambio actual",
  subtitle: "No aparecen hechos materiales en esta ventana",
  summary: "La lectura reciente no muestra variaciones materiales que cambien la situacion actual.",
  lines: [],
  total: {
    label: "Impacto visible hoy",
    amount: 0,
    displayValue: "0",
    valuePrefix: "$",
  },
  metadata: ["Ultimos 7 dias", "ARS", "Personal", "Informacion completa"],
} satisfies ChangeEvidence;

export const emptyChangeEvidenceFixture = validateChangeEvidence(emptyChangeEvidence, "0");
