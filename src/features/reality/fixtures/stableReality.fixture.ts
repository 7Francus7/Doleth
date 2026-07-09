import type { RealityViewModel } from "../model";
import { stableRealityEvidenceFixture } from "../evidence";

export const stableRealityFixture = {
  rail: {
    items: ["Corte de hoy", "ARS", "Personal", "Informacion completa"],
    state: "complete",
    wrap: "truncate",
  },
  banner: null,
  hero: {
    scenario: "stable",
    stateText: "Tu situacion esta compuesta por objetos ya registrados.",
    value: "647.500",
    valuePrefix: "$",
    valueLabel: "Base patrimonial visible",
    inlineNote: "Cada dominio tiene valor, fecha y condicion conocidos.",
    coverage: {
      title: "Base confirmada",
      value: 100,
      leftSummary: "Confirmada",
      rightSummary: "5 dominios registrados",
      state: "stable",
    },
  },
  evidence: stableRealityEvidenceFixture,
  composition: {
    title: "Composicion por dominio",
    supportingLine: "Lo que aporta y lo que compromete valor",
    rows: [
      {
        label: "Lo que aporta valor",
        supportingLabel: "Cuentas, inversiones y reservas",
        value: "792.000",
        valuePrefix: "$",
      },
      {
        kind: "with-status",
        label: "Lo que compromete valor",
        supportingLabel: "Tarjetas y deudas netas",
        status: "Ya descontado de la base",
        value: "144.500",
        valuePrefix: "$",
      },
    ],
    summary:
      "La base patrimonial se reconcilia con sus partes: lo aportado y lo comprometido ya explican el total visible.",
    summaryKind: "stable",
    actionLabel: "Ver evidencia",
    actionHref: "#reality-evidence",
  },
  stability: {
    children:
      "La estructura registrada alcanza para localizar cada objeto y confiar en la base que compone.",
    container: "none",
    kind: "stable",
  },
  actions: null,
  domains: {
    title: "Dominios de la estructura",
    rows: [
      {
        kind: "with-status",
        label: "Cuentas",
        supportingLabel: "3 cuentas - Dinero disponible y en resguardo",
        status: "Saldos confirmados",
        value: "412.000",
        valuePrefix: "$",
      },
      {
        kind: "with-status",
        label: "Tarjetas",
        supportingLabel: "2 tarjetas - Consumo financiado pendiente",
        status: "Cierres confirmados",
        value: "96.500",
        valuePrefix: "$",
      },
      {
        kind: "with-status",
        label: "Deudas y cobros",
        supportingLabel: "2 relaciones - Neto entre debes y te deben",
        status: "Condiciones confirmadas",
        value: "48.000",
        valuePrefix: "$",
      },
      {
        kind: "with-status",
        label: "Inversiones",
        supportingLabel: "2 posiciones - Valuacion vigente",
        status: "Valuacion al dia",
        value: "305.000",
        valuePrefix: "$",
      },
      {
        kind: "with-status",
        label: "Objetivos y reservas",
        supportingLabel: "1 objetivo - Dinero con proposito",
        status: "Reserva asignada",
        value: "75.000",
        valuePrefix: "$",
      },
    ],
  },
  missing: null,
  information: {
    title: "Evidencia de esta composicion",
    primaryLine:
      "La base patrimonial visible hoy puede comprobarse con objetos identificados, valores con fecha y condicion conocida.",
    causalLine:
      "No hace falta interpretar de mas: la estructura se compone de dominios registrados y localizables.",
    linkLabel: "Ver evidencia",
    linkHref: "#reality-evidence",
    state: "complete",
  },
} satisfies RealityViewModel;
