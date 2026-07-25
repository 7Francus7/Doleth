import type { RealityViewModel } from "../model";

/**
 * Solo saldo inicial: la persona ya dijo dónde está su dinero, pero todavía no
 * registró cómo cambia. Dos de seis señales cumplidas.
 */
export const initialRealityFixture = {
  rail: {
    items: ["Corte del 24 de julio", "ARS", "Personal", "Información inicial"],
    state: "partial",
    wrap: "truncate",
  },
  banner: null,
  hero: {
    scenario: "stable",
    stateText: "Tu patrimonio es la suma de lo que ya registraste.",
    value: "180.000",
    valuePrefix: "$",
    valueLabel: "Patrimonio registrado",
    inlineNote: "Inversiones y compromisos se muestran aparte: no suman ni restan de esta cifra.",
    coverage: {
      title: "Calidad de la información",
      value: 40,
      leftSummary: "Información inicial",
      rightSummary: "2 de 5 señales",
      state: "partial",
      accessibleLabel: "Se cumplen 2 de las 5 señales de información verificadas.",
    },
  },
  evidence: null,
  synthesis: "Tu patrimonio registrado está distribuido en 1 cuenta activa.",
  sections: [
    {
      id: "money",
      title: "Dónde está tu dinero",
      supportingLine: "Cuentas activas, con su participación sobre el total operativo",
      rows: [
        {
          kind: "with-status",
          label: "Banco",
          supportingLabel: "Banco · 100% del dinero operativo",
          status: "sin movimientos registrados",
          value: "180.000",
          valuePrefix: "$",
        },
        {
          label: "Dinero operativo",
          supportingLabel: "Σ saldos de 1 cuenta activa",
          value: "180.000",
          valuePrefix: "$",
        },
      ],
      note: "El saldo de cada cuenta es su saldo inicial más los movimientos no anulados. La participación se calcula sobre el dinero operativo.",
      noteKind: "stable",
      actionLabel: "Ver cuentas",
      actionHref: "/cuentas",
    },
    {
      id: "commitments",
      title: "Qué tenés comprometido",
      supportingLine: "Todavía sin pagos próximos cargados",
      rows: [],
      note: "No hay compromisos próximos cargados. Tu proyección solo refleja el dinero actual.",
      noteKind: "neutral",
      actionLabel: "Cargar un pago",
      actionHref: "/proximo/nuevo",
    },
    {
      id: "activity",
      title: "Actividad de julio",
      supportingLine: "Del 1 de julio al 31 de julio · sin movimientos vigentes",
      rows: [
        {
          kind: "with-status",
          label: "Ingresos del mes",
          supportingLabel: "Movimientos vigentes de julio",
          status: "Sin ingresos registrados",
          value: "0",
          valuePrefix: "$",
        },
        {
          kind: "with-status",
          label: "Gastos del mes",
          supportingLabel: "Movimientos vigentes de julio",
          status: "Registrados y no anulados",
          value: "0",
          valuePrefix: "$",
        },
        {
          label: "Resultado del mes",
          supportingLabel: "Ingresos − gastos, sin transferencias",
          value: "0",
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
    stateLabel: "Información inicial",
    ratioLabel: "2 de 5 señales",
    summary: "Ya representaste dónde está tu dinero. Falta información para explicar cómo cambia.",
    signals: [
      {
        id: "active-account",
        label: "Al menos una cuenta activa",
        state: "met",
        reading: "1 cuenta activa en uso.",
        matters: "Sin una cuenta activa no hay patrimonio que componer ni movimientos que registrar.",
      },
      {
        id: "accounts-with-origin",
        label: "Cada cuenta tiene origen",
        state: "met",
        reading: "Todas tus cuentas tienen saldo inicial o actividad registrada.",
        matters:
          "Una cuenta sin saldo inicial ni movimientos aporta cero al patrimonio sin decir por qué.",
      },
      {
        id: "movements",
        label: "Movimientos en el período",
        state: "missing",
        reading: "Este mes todavía no tiene movimientos registrados.",
        matters: "Sin movimientos Doleth puede decir cuánto tenés, pero no cómo cambió.",
        actionLabel: "Registrar movimiento",
        actionHref: "/movimientos/nuevo",
      },
      {
        id: "income",
        label: "Ingresos registrados",
        state: "missing",
        reading: "No encontramos ingresos registrados en el período.",
        matters: "Sin ingresos cargados el resultado del mes solo muestra gastos, aunque hayas cobrado.",
        actionLabel: "Registrar ingreso",
        actionHref: "/movimientos/nuevo",
      },
      {
        id: "upcoming",
        label: "Compromisos cargados",
        state: "missing",
        reading: "No hay compromisos próximos cargados.",
        matters: "Sin compromisos cargados la proyección solo refleja el dinero actual.",
        actionLabel: "Cargar un pago",
        actionHref: "/proximo/nuevo",
      },
    ],
  },
  missing: {
    title: "Tu realidad está parcialmente representada",
    primaryLine: "Ya representaste dónde está tu dinero. Falta información para explicar cómo cambia.",
    causalLine: "Cada señal de abajo dice qué falta y por qué cambia lo que Doleth puede explicar.",
    linkLabel: "Registrar movimiento",
    linkHref: "/movimientos/nuevo",
    state: "partial",
  },
  information: {
    title: "De dónde sale esta composición",
    primaryLine: "No usa saldos editables, estimaciones ni cifras simuladas.",
    causalLine:
      "El patrimonio se deriva del saldo inicial de cada cuenta y del ledger, excluyendo movimientos anulados. Las inversiones y los compromisos se contabilizan por separado y se declaran como tales.",
    linkLabel: "Ver cuentas",
    linkHref: "/cuentas",
    state: "partial",
  },
} satisfies RealityViewModel;
