import type { ProgressViewModel } from "../model";

/** Sin cuentas no hay resultado ni progreso que medir. */
export const emptyProgressFixture = {
  rail: { items: ["Días 1 a 24", "ARS", "Personal", "Primer período"], state: "partial", wrap: "truncate" },
  banner: null,
  hero: {
    scenario: "new",
    stateText: "Empecemos por tu base real.",
    valueLabel: "Creá tu primera cuenta para empezar a medir progreso.",
  },
  evidence: null,
  comparison: {
    title: "Tramos equivalentes",
    supportingLine:
      "del miércoles 1 al viernes 24 de julio contra del lunes 1 al miércoles 24 de junio",
    rows: [
      {
        label: "Resultado del tramo anterior",
        supportingLabel: "Sin movimientos registrados",
        value: "0",
        valuePrefix: "$",
      },
      {
        kind: "with-status",
        label: "Resultado de este tramo",
        supportingLabel: "24 días · 0 con registro",
        status: "Sin referencia todavía",
        value: "0",
        valuePrefix: "$",
        state: "default",
      },
      {
        label: "Diferencia entre tramos",
        supportingLabel: "Misma cantidad de días en los dos tramos",
        value: "0",
        valuePrefix: "$",
      },
    ],
    summary: "Sin cuentas registradas no hay resultado ni progreso para medir.",
    summaryKind: "neutral",
  },
  indicators: null,
  milestones: null,
  notice: null,
  stability: {
    children: "Creá tu primera cuenta para empezar a medir tu progreso.",
    container: "none",
    kind: "neutral",
  },
  actions: {
    primary: "add-first-account",
    primaryLabel: "Crear una cuenta",
    secondaryActions: [
      { id: "changes", label: "Ver qué cambió" },
      { id: "history", label: "Ver movimientos" },
    ],
    state: "default",
  },
  missing: {
    title: "Falta tu base financiera",
    primaryLine: "Sin cuentas registradas no hay resultado ni progreso para medir.",
    causalLine: "Creá al menos una cuenta con su saldo inicial para habilitar esta pantalla.",
    linkLabel: "Crear cuenta",
    linkHref: "/cuentas/nueva",
    state: "partial",
  },
  information: {
    title: "De dónde salen estos indicadores",
    primaryLine: "No usa metas inventadas ni presupuestos inexistentes.",
    causalLine:
      "Cada indicador se deriva del ledger real y compara tramos equivalentes, excluyendo movimientos anulados y transferencias entre tus cuentas.",
    linkLabel: "Ver movimientos",
    linkHref: "/movimientos",
    state: "partial",
  },
} satisfies ProgressViewModel;
