import type { ChangesViewModel } from "../model";
import { incompleteChangeEvidenceFixture } from "../evidence";
import { upChangesFixture } from "./upChanges.fixture";

/** El historial empieza dentro del período anterior: la comparación no lo cubre entero. */
export const partialChangesFixture = {
  ...upChangesFixture,
  rail: {
    items: ["Últimos 7 días", "ARS", "Personal", "Comparación parcial"],
    state: "partial",
    wrap: "truncate",
  },
  hero: {
    ...upChangesFixture.hero,
    stateText: "Esta comparación usa información parcial.",
    value: "18.900",
    valuePrefix: "$",
    inlineNote: "+1,9% sobre los $994.100 con los que empezó el período.",
    coverage: {
      ...upChangesFixture.hero.coverage,
      leftSummary: "2 causas",
      rightSummary: "$18.900 netos",
      accessibleLabel: "Las causas suman $18.900, exactamente el cambio neto.",
    },
  },
  evidence: incompleteChangeEvidenceFixture,
  comparison: {
    ...upChangesFixture.comparison,
    rows: [
      {
        label: "Patrimonio al inicio",
        supportingLabel: "Viernes 18 de julio",
        value: "994.100",
        valuePrefix: "$",
      },
      {
        label: "Patrimonio hoy",
        supportingLabel: "Hoy",
        value: "1.013.000",
        valuePrefix: "$",
      },
      {
        kind: "with-status",
        label: "Diferencia",
        supportingLabel: "+1,9%",
        status: "Parcial",
        value: "18.900",
        valuePrefix: "$",
        state: "default",
      },
      {
        label: "Mismo período anterior (7 días)",
        supportingLabel: "2 movimientos",
        value: "6.500",
        valuePrefix: "$",
      },
    ],
    summary:
      "Tu historial empieza dentro del período anterior, así que la comparación no cubre sus 7 días completos.",
    summaryKind: "neutral",
  },
  transfers: null,
  stability: { ...upChangesFixture.stability, kind: "neutral" },
  information: {
    ...upChangesFixture.information,
    primaryLine:
      "4 movimientos considerados del viernes 18 al jueves 24 de julio; 2 en el período anterior.",
    state: "partial",
  },
} satisfies ChangesViewModel;
