import { largeRealityEvidenceFixture } from "../evidence/fixtures";
import type { RealityViewModel } from "../model";

/**
 * Importes de ocho cifras y una lectura degradada de compromisos. Sirve para
 * verificar que nada se desborda en 320 px y que una lectura caída se declara en
 * vez de mostrarse como cero.
 */
export const largeRealityFixture = {
  rail: {
    items: ["Corte del 24 de julio", "ARS", "Personal", "Información suficiente"],
    state: "complete",
    wrap: "truncate",
  },
  banner: null,
  hero: {
    scenario: "stable",
    stateText: "Tu patrimonio es la suma de lo que ya registraste.",
    value: "145.930.600",
    valuePrefix: "$",
    valueLabel: "Patrimonio registrado",
    inlineNote: "Inversiones y compromisos se muestran aparte: no suman ni restan de esta cifra.",
    coverage: {
      title: "Calidad de la información",
      value: 75,
      leftSummary: "Información suficiente",
      rightSummary: "3 de 4 señales",
      state: "stable",
      accessibleLabel: "Se cumplen 3 de las 4 señales de información verificadas.",
    },
  },
  evidence: largeRealityEvidenceFixture,
  synthesis:
    "Tu patrimonio registrado está distribuido en 2 cuentas activas. Además tenés 3 inversiones registradas, que se cuentan aparte.",
  sections: [
    {
      id: "money",
      title: "Dónde está tu dinero",
      supportingLine: "Cuentas activas, con su participación sobre el total operativo",
      rows: [
        {
          kind: "with-status",
          label: "Banco principal",
          supportingLabel: "Banco · 88% del dinero operativo",
          status: "última actividad el 24 de julio",
          value: "128.450.300",
          valuePrefix: "$",
        },
        {
          kind: "with-status",
          label: "Caja de ahorro",
          supportingLabel: "Ahorro · 11% del dinero operativo",
          status: "última actividad el 18 de julio",
          value: "17.480.300",
          valuePrefix: "$",
        },
        {
          label: "Dinero operativo",
          supportingLabel: "Σ saldos de 2 cuentas activas",
          value: "145.930.600",
          valuePrefix: "$",
        },
      ],
      note: "El saldo de cada cuenta es su saldo inicial más los movimientos no anulados. La participación se calcula sobre el dinero operativo.",
      noteKind: "stable",
      actionLabel: "Ver cuentas",
      actionHref: "/cuentas",
    },
    {
      id: "outside",
      title: "Fuera del uso cotidiano",
      supportingLine: "Lo que conserva su historia y lo que vive en otro dominio",
      rows: [
        {
          kind: "with-status",
          label: "Inversiones",
          supportingLabel: "3 posiciones registradas",
          status: "No suma al patrimonio en cuentas",
          value: "48.900.000",
          valuePrefix: "$",
        },
      ],
      note: "Las inversiones se muestran aparte: no tienen una cuenta que las respalde, así que sumarlas al patrimonio contaría dos veces lo mismo.",
      noteKind: "neutral",
      actionLabel: "Ver inversiones",
      actionHref: "/inversiones",
    },
    {
      id: "commitments",
      title: "Qué tenés comprometido",
      supportingLine: "Próximos pagos cargados, sin restar del patrimonio",
      rows: [],
      note: "Los compromisos no se restan del patrimonio: todavía no ocurrieron.",
      noteKind: "neutral",
      notice:
        "No pudimos cargar los próximos pagos. Esta lectura queda sin la parte comprometida, no en cero.",
    },
    {
      id: "activity",
      title: "Actividad de julio",
      supportingLine: "Del 1 de julio al 31 de julio · 12 movimientos vigentes",
      rows: [
        {
          kind: "with-status",
          label: "Ingresos del mes",
          supportingLabel: "Movimientos vigentes de julio",
          status: "Registrados y no anulados",
          value: "24.800.000",
          valuePrefix: "$",
        },
        {
          kind: "with-status",
          label: "Gastos del mes",
          supportingLabel: "Movimientos vigentes de julio",
          status: "Registrados y no anulados",
          value: "9.317.450",
          valuePrefix: "$",
        },
        {
          label: "Resultado del mes",
          supportingLabel: "Ingresos − gastos, sin transferencias",
          value: "15.482.550",
          valuePrefix: "$",
        },
      ],
      note: "Solo cuentan los movimientos vigentes del período.",
      noteKind: "neutral",
      actionLabel: "Ver movimientos",
      actionHref: "/movimientos",
    },
  ],
  stability: {
    children:
      "Cada cifra de esta pantalla proviene de objetos registrados y localizables: cuentas, inversiones, compromisos y movimientos.",
    container: "none",
    kind: "stable",
  },
  primaryAction: {
    label: "Revisar julio",
    href: "/mi-realidad/cierre",
    supportingLine:
      "Una revisión guiada del mes: cuentas, movimientos, compromisos y resultado. No cierra nada ni bloquea movimientos.",
  },
  quality: {
    title: "Calidad de la información",
    supportingLine: "Señales explícitas, no un puntaje",
    stateLabel: "Información suficiente",
    ratioLabel: "3 de 4 señales",
    summary: "Doleth tiene suficiente información para explicar tu situación registrada.",
    notice:
      "No pudimos verificar 2 señales sobre próximos pagos: quedan fuera del recuento en vez de contarse como faltantes.",
    signals: [
      {
        id: "active-account",
        label: "Al menos una cuenta activa",
        state: "met",
        reading: "2 cuentas activas en uso.",
        matters: "Sin una cuenta activa no hay patrimonio que componer ni movimientos que registrar.",
      },
      {
        id: "accounts-with-origin",
        label: "Cada cuenta tiene origen",
        state: "missing",
        reading:
          "Alguna cuenta quedó en cero y sin movimientos: su saldo no proviene de nada cargado.",
        matters:
          "Una cuenta sin saldo inicial ni movimientos aporta cero al patrimonio sin decir por qué.",
        actionLabel: "Ver cuentas",
        actionHref: "/cuentas",
      },
      {
        id: "movements",
        label: "Movimientos en el período",
        state: "met",
        reading: "12 movimientos registrados este mes.",
        matters: "Sin movimientos Doleth puede decir cuánto tenés, pero no cómo cambió.",
      },
      {
        id: "income",
        label: "Ingresos registrados",
        state: "met",
        reading: "$24.800.000 en ingresos registrados este mes.",
        matters: "Sin ingresos cargados el resultado del mes solo muestra gastos, aunque hayas cobrado.",
      },
    ],
  },
  missing: null,
  information: {
    title: "De dónde sale esta composición",
    primaryLine: "No usa saldos editables, estimaciones ni cifras simuladas.",
    causalLine:
      "El patrimonio se deriva del saldo inicial de cada cuenta y del ledger, excluyendo movimientos anulados. Las inversiones y los compromisos se contabilizan por separado y se declaran como tales.",
    linkLabel: "Ver cuentas",
    linkHref: "/cuentas",
    state: "complete",
  },
} satisfies RealityViewModel;
