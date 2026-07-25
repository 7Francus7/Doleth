import type { ChangesViewModel } from "../model";
import { stableChangeEvidenceFixture } from "../evidence";

/** Base de las demás variantes: una semana que sube por un ingreso material. */
export const upChangesFixture = {
  rail: {
    items: ["Últimos 7 días", "ARS", "Personal", "Comparación completa"],
    state: "complete",
    wrap: "truncate",
  },
  banner: null,
  hero: {
    scenario: "stable",
    stateText: "Del viernes 18 al jueves 24 de julio tenés $55.000 más.",
    value: "55.000",
    valuePrefix: "$",
    valueLabel: "Cambio de patrimonio del viernes 18 al jueves 24 de julio",
    inlineNote: "+4,8% sobre los $1.153.700 con los que empezó el período.",
    coverage: {
      title: "Cambio explicado por causas",
      value: 100,
      leftSummary: "3 causas",
      rightSummary: "$55.000 netos",
      state: "stable",
      accessibleLabel: "Las causas suman $55.000, exactamente el cambio neto.",
    },
  },
  evidence: stableChangeEvidenceFixture,
  comparison: {
    title: "Período comparado",
    supportingLine:
      "del viernes 18 al jueves 24 de julio contra del viernes 11 al jueves 17 de julio",
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
        value: "1.208.700",
        valuePrefix: "$",
      },
      {
        kind: "with-status",
        label: "Diferencia",
        supportingLabel: "+4,8%",
        status: "Sube",
        value: "55.000",
        valuePrefix: "$",
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
      "El patrimonio pasó de $1.153.700 a $1.208.700 por 6 movimientos no anulados.",
    summaryKind: "stable",
  },
  causes: {
    title: "Qué explica el cambio",
    supportingLine: "Categorías ordenadas por impacto · material desde 20% del bruto",
    rows: [
      {
        id: "category:salary",
        label: "Sueldo",
        supportingLabel: "62% del movimiento bruto · 1 movimiento",
        value: "120.000",
        valuePrefix: "+$",
        direction: "in",
        material: true,
        href: "/movimientos?month=2026-07&categoryId=salary&volver=%2Fcambios",
      },
      {
        id: "category:supermarket",
        label: "Supermercado",
        supportingLabel: "24% del movimiento bruto · 3 movimientos",
        value: "46.300",
        valuePrefix: "-$",
        direction: "out",
        material: true,
        href: "/movimientos?month=2026-07&categoryId=supermarket&volver=%2Fcambios",
      },
      {
        id: "category:transport",
        label: "Transporte",
        supportingLabel: "14% del movimiento bruto · 2 movimientos",
        value: "18.700",
        valuePrefix: "-$",
        direction: "out",
        material: false,
        href: "/movimientos?month=2026-07&categoryId=transport&volver=%2Fcambios",
      },
    ],
    note: "La suma de las causas da exactamente el cambio neto del período.",
  },
  transfers: {
    line: "También moviste $50.000 entre tus cuentas en 1 transferencia. No cambian tu patrimonio, así que no cuentan como causa.",
  },
  notice: null,
  stability: {
    children:
      "Cada causa sale de movimientos no anulados del período. Las transferencias entre tus cuentas quedan fuera porque no cambian tu patrimonio.",
    container: "none",
    kind: "stable",
  },
  actions: {
    primary: "resolve",
    primaryLabel: "Ver los movimientos que explican el cambio",
    secondaryActions: [
      { id: "upcoming", label: "Ver próximos pagos" },
      { id: "history", label: "Ver movimientos" },
    ],
    state: "default",
  },
  missing: null,
  information: {
    title: "De dónde sale esta lectura",
    primaryLine:
      "6 movimientos considerados del viernes 18 al jueves 24 de julio; 4 en el período anterior.",
    causalLine:
      "El cambio se deriva del ledger real: movimientos no anulados, sin transferencias internas y sin contar dos veces una corrección.",
    linkLabel: "Ver movimientos",
    linkHref: "/movimientos",
    state: "complete",
  },
} satisfies ChangesViewModel;
