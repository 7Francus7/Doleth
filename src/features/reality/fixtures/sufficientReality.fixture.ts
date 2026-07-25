import { sufficientRealityEvidenceFixture } from "../evidence/fixtures";
import type { RealityViewModel } from "../model";

/**
 * Cuentas activas + archivada + inversiones + compromisos. Las seis señales se
 * cumplen: es la lectura más completa que el dominio actual puede sostener, y aun
 * así no se afirma que represente toda la vida financiera real.
 */
export const sufficientRealityFixture = {
  rail: {
    items: ["Corte del 24 de julio", "ARS", "Personal", "Completa para análisis"],
    state: "complete",
    wrap: "truncate",
  },
  banner: null,
  hero: {
    scenario: "stable",
    stateText: "Tu patrimonio es la suma de lo que ya registraste.",
    value: "538.500",
    valuePrefix: "$",
    valueLabel: "Patrimonio registrado",
    inlineNote: "Inversiones y compromisos se muestran aparte: no suman ni restan de esta cifra.",
    coverage: {
      title: "Calidad de la información",
      value: 100,
      leftSummary: "Completa para análisis",
      rightSummary: "6 de 6 señales",
      state: "stable",
      accessibleLabel: "Se cumplen 6 de las 6 señales de información verificadas.",
    },
  },
  evidence: sufficientRealityEvidenceFixture,
  synthesis:
    "Tu patrimonio registrado está distribuido en 2 cuentas activas y 1 archivada. Además tenés 2 inversiones registradas, que se cuentan aparte.",
  sections: [
    {
      id: "money",
      title: "Dónde está tu dinero",
      supportingLine: "Cuentas activas, con su participación sobre el total operativo",
      rows: [
        {
          kind: "with-status",
          label: "Banco",
          supportingLabel: "Banco · 82% del dinero operativo",
          status: "última actividad el 23 de julio",
          value: "412.000",
          valuePrefix: "$",
        },
        {
          kind: "with-status",
          label: "Efectivo",
          supportingLabel: "Efectivo · 17% del dinero operativo",
          status: "última actividad el 22 de julio",
          value: "86.500",
          valuePrefix: "$",
        },
        {
          label: "Dinero operativo",
          supportingLabel: "Σ saldos de 2 cuentas activas",
          value: "498.500",
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
          label: "Cuenta vieja",
          supportingLabel: "Ahorro",
          status: "Fuera del uso cotidiano · última actividad el 12 de mayo",
          value: "40.000",
          valuePrefix: "$",
        },
        {
          kind: "with-status",
          label: "Inversiones",
          supportingLabel: "2 posiciones registradas",
          status: "No suma al patrimonio en cuentas",
          value: "305.000",
          valuePrefix: "$",
        },
      ],
      note: "Estas cuentas conservan su historia, pero están fuera del uso cotidiano. Sus saldos siguen dentro del patrimonio; las inversiones no, porque no tienen una cuenta que las respalde.",
      noteKind: "neutral",
      actionLabel: "Ver inversiones",
      actionHref: "/inversiones",
    },
    {
      id: "commitments",
      title: "Qué tenés comprometido",
      supportingLine: "Pagos pendientes, con el horizonte de 30 días declarado",
      rows: [
        {
          kind: "with-status",
          label: "Próximos 30 días",
          supportingLabel: "2 pagos pendientes hasta el 23 de agosto",
          status: "Dentro del horizonte de la proyección",
          value: "82.600",
          valuePrefix: "$",
        },
        {
          kind: "with-status",
          label: "Más adelante",
          supportingLabel: "1 pago después del 23 de agosto",
          status: "Fuera del horizonte: no se proyecta",
          value: "73.000",
          valuePrefix: "$",
        },
        {
          label: "Total comprometido",
          supportingLabel: "Σ de 3 pagos pendientes",
          value: "155.600",
          valuePrefix: "$",
        },
      ],
      note: "Ninguno de estos importes se resta del patrimonio: son compromisos cargados, no movimientos ocurridos.",
      noteKind: "neutral",
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
          supportingLabel: "9 movimientos en total",
          status: "Registrados y no anulados",
          value: "900.000",
          valuePrefix: "$",
        },
        {
          kind: "with-status",
          label: "Gastos del mes",
          supportingLabel: "Movimientos vigentes de julio",
          status: "Registrados y no anulados",
          value: "448.700",
          valuePrefix: "$",
        },
        {
          label: "Resultado del mes",
          supportingLabel: "Ingresos − gastos, sin transferencias",
          value: "451.300",
          valuePrefix: "$",
        },
      ],
      note: "Solo cuentan los movimientos vigentes del período. Se movieron $50.000 entre cuentas propias en 1 transferencia: no cambian el patrimonio, así que quedan fuera del resultado. 2 movimientos anulados siguen en el historial sin efecto sobre las cifras.",
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
    stateLabel: "Completa para análisis",
    ratioLabel: "6 de 6 señales",
    summary:
      "Doleth tiene suficiente información para explicar tu situación registrada y compararla entre períodos.",
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
        state: "met",
        reading: "Todas tus cuentas tienen saldo inicial o actividad registrada.",
        matters:
          "Una cuenta sin saldo inicial ni movimientos aporta cero al patrimonio sin decir por qué.",
      },
      {
        id: "movements",
        label: "Movimientos en el período",
        state: "met",
        reading: "9 movimientos registrados este mes.",
        matters: "Sin movimientos Doleth puede decir cuánto tenés, pero no cómo cambió.",
      },
      {
        id: "income",
        label: "Ingresos registrados",
        state: "met",
        reading: "$900.000 en ingresos registrados este mes.",
        matters: "Sin ingresos cargados el resultado del mes solo muestra gastos, aunque hayas cobrado.",
      },
      {
        id: "upcoming",
        label: "Compromisos cargados",
        state: "met",
        reading: "3 pagos próximos cargados.",
        matters: "Sin compromisos cargados la proyección solo refleja el dinero actual.",
      },
      {
        id: "reviewed-overdue",
        label: "Sin pagos vencidos por revisar",
        state: "met",
        reading: "Ningún pago cargado quedó con la fecha pasada.",
        matters: "Un pago vencido sin confirmar puede significar que ya lo pagaste y falta registrarlo.",
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
