import type { ChangesViewModel } from "../model";
import { upChangesFixture } from "./upChanges.fixture";

/** Muchas causas e importes en millones: prueba el corte en "Otros" y el ancho. */
export const denseChangesFixture = {
  ...upChangesFixture,
  hero: {
    ...upChangesFixture.hero,
    scenario: "attention",
    stateText: "Del viernes 18 al jueves 24 de julio tenés $2.480.900 menos.",
    value: "2.480.900",
    valuePrefix: "-$",
    inlineNote: "-14,2% sobre los $17.480.300 con los que empezó el período.",
    coverage: {
      ...upChangesFixture.hero.coverage,
      leftSummary: "5 causas",
      rightSummary: "-$2.480.900 netos",
      accessibleLabel: "Las causas suman -$2.480.900, exactamente el cambio neto.",
    },
  },
  comparison: {
    ...upChangesFixture.comparison,
    rows: [
      {
        label: "Patrimonio al inicio",
        supportingLabel: "Viernes 18 de julio",
        value: "17.480.300",
        valuePrefix: "$",
      },
      { label: "Patrimonio hoy", supportingLabel: "Hoy", value: "14.999.400", valuePrefix: "$" },
      {
        kind: "with-status",
        label: "Diferencia",
        supportingLabel: "-14,2%",
        status: "Baja",
        value: "2.480.900",
        valuePrefix: "-$",
        state: "attention",
      },
      {
        label: "Mismo período anterior (7 días)",
        supportingLabel: "11 movimientos",
        value: "1.204.500",
        valuePrefix: "$",
      },
    ],
    summary: "El patrimonio pasó de $17.480.300 a $14.999.400 por 23 movimientos no anulados.",
    summaryKind: "attention",
  },
  causes: {
    ...upChangesFixture.causes,
    rows: [
      {
        id: "category:taxes",
        label: "Impuestos y servicios",
        supportingLabel: "38% del movimiento bruto · 6 movimientos",
        value: "1.420.000",
        valuePrefix: "-$",
        direction: "out",
        material: true,
        href: "/movimientos?month=2026-07&categoryId=taxes&volver=%2Fcambios",
      },
      {
        id: "category:rent",
        label: "Alquiler",
        supportingLabel: "21% del movimiento bruto · 1 movimiento",
        value: "780.000",
        valuePrefix: "-$",
        direction: "out",
        material: true,
        href: "/movimientos?month=2026-07&categoryId=rent&volver=%2Fcambios",
      },
      {
        id: "category:supermarket",
        label: "Supermercado y almacén de barrio",
        supportingLabel: "14% del movimiento bruto · 7 movimientos",
        value: "512.400",
        valuePrefix: "-$",
        direction: "out",
        material: false,
        href: "/movimientos?month=2026-07&categoryId=supermarket&volver=%2Fcambios",
      },
      {
        id: "category:health",
        label: "Salud",
        supportingLabel: "9% del movimiento bruto · 2 movimientos",
        value: "318.700",
        valuePrefix: "-$",
        direction: "out",
        material: false,
        href: "/movimientos?month=2026-07&categoryId=health&volver=%2Fcambios",
      },
      {
        id: "other",
        label: "Otros",
        supportingLabel: "15% del movimiento bruto · 7 movimientos",
        value: "550.200",
        valuePrefix: "-$",
        direction: "out",
        material: false,
      },
    ],
    note: 'Las 3 causas menores restantes están agrupadas en "Otros": la suma de las causas sigue dando el cambio neto.',
  },
  transfers: {
    line: "También moviste $3.200.000 entre tus cuentas en 4 transferencias. No cambian tu patrimonio, así que no cuentan como causa.",
  },
  stability: { ...upChangesFixture.stability, kind: "attention" },
} satisfies ChangesViewModel;
