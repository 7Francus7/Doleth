import type { ChangesViewModel } from "../model";
import { attentionChangeEvidenceFixture } from "../evidence";
import { upChangesFixture } from "./upChanges.fixture";

/** La misma semana, leída a la baja: gastos materiales sin ingreso que los compense. */
export const downChangesFixture = {
  ...upChangesFixture,
  hero: {
    ...upChangesFixture.hero,
    scenario: "attention",
    stateText: "Del viernes 18 al jueves 24 de julio tenés $84.300 menos.",
    value: "84.300",
    valuePrefix: "-$",
    inlineNote: "-7,3% sobre los $1.153.700 con los que empezó el período.",
    coverage: {
      ...upChangesFixture.hero.coverage,
      leftSummary: "2 causas",
      rightSummary: "-$84.300 netos",
      accessibleLabel: "Las causas suman -$84.300, exactamente el cambio neto.",
    },
  },
  evidence: attentionChangeEvidenceFixture,
  comparison: {
    ...upChangesFixture.comparison,
    rows: [
      {
        label: "Patrimonio al inicio",
        supportingLabel: "Viernes 18 de julio",
        value: "1.153.700",
        valuePrefix: "$",
      },
      {
        label: "Patrimonio hoy",
        supportingLabel: "Hoy",
        value: "1.069.400",
        valuePrefix: "$",
      },
      {
        kind: "with-status",
        label: "Diferencia",
        supportingLabel: "-7,3%",
        status: "Baja",
        value: "84.300",
        valuePrefix: "-$",
        state: "attention",
      },
      {
        label: "Mismo período anterior (7 días)",
        supportingLabel: "4 movimientos",
        value: "12.400",
        valuePrefix: "-$",
      },
    ],
    summary: "El patrimonio pasó de $1.153.700 a $1.069.400 por 5 movimientos no anulados.",
    summaryKind: "attention",
  },
  causes: {
    ...upChangesFixture.causes,
    rows: [
      {
        id: "category:rent",
        label: "Alquiler",
        supportingLabel: "68% del movimiento bruto · 1 movimiento",
        value: "62.000",
        valuePrefix: "-$",
        direction: "out",
        material: true,
        href: "/movimientos?month=2026-07&categoryId=rent&volver=%2Fcambios",
      },
      {
        id: "category:supermarket",
        label: "Supermercado",
        supportingLabel: "32% del movimiento bruto · 4 movimientos",
        value: "22.300",
        valuePrefix: "-$",
        direction: "out",
        material: true,
        href: "/movimientos?month=2026-07&categoryId=supermarket&volver=%2Fcambios",
      },
    ],
  },
  stability: { ...upChangesFixture.stability, kind: "attention" },
} satisfies ChangesViewModel;
