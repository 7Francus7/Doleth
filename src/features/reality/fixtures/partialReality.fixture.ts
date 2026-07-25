import { partialRealityEvidenceFixture } from "../evidence/fixtures";
import type { RealityViewModel } from "../model";

/**
 * Representación parcial: hay movimientos y compromisos, pero ningún ingreso
 * registrado y un pago vencido sin confirmar. Cuatro de seis señales.
 */
export const partialRealityFixture = {
  rail: {
    items: ["Corte del 24 de julio", "ARS", "Personal", "Representación parcial"],
    state: "partial",
    wrap: "truncate",
  },
  banner: null,
  hero: {
    scenario: "stable",
    stateText: "Tu patrimonio es la suma de lo que ya registraste.",
    value: "128.400",
    valuePrefix: "$",
    valueLabel: "Patrimonio registrado",
    inlineNote: "Inversiones y compromisos se muestran aparte: no suman ni restan de esta cifra.",
    coverage: {
      title: "Calidad de la información",
      value: 67,
      leftSummary: "Representación parcial",
      rightSummary: "4 de 6 señales",
      state: "partial",
      accessibleLabel: "Se cumplen 4 de las 6 señales de información verificadas.",
    },
  },
  evidence: partialRealityEvidenceFixture,
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
          status: "última actividad el 22 de julio",
          value: "128.400",
          valuePrefix: "$",
        },
        {
          label: "Dinero operativo",
          supportingLabel: "Σ saldos de 1 cuenta activa",
          value: "128.400",
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
      supportingLine: "Pagos pendientes, con el horizonte de 30 días declarado",
      rows: [
        {
          kind: "with-status",
          label: "Vencidos",
          supportingLabel: "1 pago con fecha pasada",
          status: "Sin confirmar",
          value: "41.800",
          valuePrefix: "$",
          state: "attention",
        },
        {
          label: "Total comprometido",
          supportingLabel: "Σ de 1 pago pendiente",
          value: "41.800",
          valuePrefix: "$",
        },
      ],
      note: "Ninguno de estos importes se resta del patrimonio: son compromisos cargados, no movimientos ocurridos.",
      noteKind: "attention",
      actionLabel: "Ver Próximo",
      actionHref: "/proximo",
    },
    {
      id: "activity",
      title: "Actividad de julio",
      supportingLine: "Del 1 de julio al 31 de julio",
      rows: [
        {
          kind: "with-status",
          label: "Ingresos del mes",
          supportingLabel: "4 movimientos en total",
          status: "Sin ingresos registrados",
          value: "0",
          valuePrefix: "$",
        },
        {
          kind: "with-status",
          label: "Gastos del mes",
          supportingLabel: "Movimientos vigentes de julio",
          status: "Registrados y no anulados",
          value: "51.600",
          valuePrefix: "$",
        },
        {
          label: "Resultado del mes",
          supportingLabel: "Ingresos − gastos, sin transferencias",
          value: "51.600",
          valuePrefix: "-$",
          state: "attention",
        },
      ],
      note: "Solo cuentan los movimientos vigentes del período. 1 movimiento anulado sigue en el historial sin efecto sobre las cifras.",
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
    stateLabel: "Representación parcial",
    ratioLabel: "4 de 6 señales",
    summary: "Esta lectura usa únicamente la información cargada en Doleth.",
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
        state: "met",
        reading: "4 movimientos registrados este mes.",
        matters: "Sin movimientos Doleth puede decir cuánto tenés, pero no cómo cambió.",
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
        state: "met",
        reading: "1 pago próximo cargado.",
        matters: "Sin compromisos cargados la proyección solo refleja el dinero actual.",
      },
      {
        id: "reviewed-overdue",
        label: "Sin pagos vencidos por revisar",
        state: "missing",
        reading: "1 pago venció y sigue sin confirmar.",
        matters: "Un pago vencido sin confirmar puede significar que ya lo pagaste y falta registrarlo.",
        actionLabel: "Revisar próximos pagos",
        actionHref: "/proximo",
      },
    ],
  },
  missing: {
    title: "Tu realidad está parcialmente representada",
    primaryLine: "Esta lectura usa únicamente la información cargada en Doleth.",
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
