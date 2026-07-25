import type { ChangesViewModel } from "../model";
import { upChangesFixture } from "./upChanges.fixture";

/** Variación por debajo del umbral de materialidad: estable, no "sin cambios". */
export const stableChangesFixture = {
  ...upChangesFixture,
  rail: { ...upChangesFixture.rail, items: ["Últimos 7 días", "ARS", "Personal", "Comparación completa"] },
  hero: {
    ...upChangesFixture.hero,
    stateText: "Tu situación se mantuvo prácticamente igual.",
    value: "3.200",
    valuePrefix: "-$",
    inlineNote: "-0,3% sobre los $1.153.700 con los que empezó el período.",
    coverage: {
      ...upChangesFixture.hero.coverage,
      leftSummary: "2 causas",
      rightSummary: "-$3.200 netos",
      accessibleLabel: "Las causas suman -$3.200, exactamente el cambio neto.",
    },
  },
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
        value: "1.150.500",
        valuePrefix: "$",
      },
      {
        kind: "with-status",
        label: "Diferencia",
        supportingLabel: "-0,3%",
        status: "Estable",
        value: "3.200",
        valuePrefix: "-$",
        state: "default",
      },
      {
        label: "Mismo período anterior (7 días)",
        supportingLabel: "4 movimientos",
        value: "12.400",
        valuePrefix: "-$",
      },
    ],
    summary:
      "La variación quedó por debajo de $11.537, el umbral a partir del cual consideramos que un cambio es material.",
    summaryKind: "neutral",
  },
  causes: {
    ...upChangesFixture.causes,
    rows: [
      {
        id: "category:transport",
        label: "Transporte",
        supportingLabel: "56% del movimiento bruto · 2 movimientos",
        value: "2.400",
        valuePrefix: "-$",
        direction: "out",
        material: true,
        href: "/movimientos?month=2026-07&categoryId=transport&volver=%2Fcambios",
      },
      {
        id: "uncategorized:EXPENSE",
        label: "Gastos sin categoría",
        supportingLabel: "44% del movimiento bruto · 1 movimiento",
        value: "800",
        valuePrefix: "-$",
        direction: "out",
        material: true,
      },
    ],
  },
  transfers: null,
  stability: { ...upChangesFixture.stability, kind: "neutral" },
} satisfies ChangesViewModel;
