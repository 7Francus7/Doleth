import "server-only";
import { formatCents } from "../../../lib/finance/domain";
import { getDashboardData } from "../../../lib/finance/data";
import type { NowViewModel } from "../model";

export async function getNowModel(): Promise<NowViewModel> {
  const data = await getDashboardData();
  const hasAccounts = data.accounts.length > 0;
  const coverage = data.upcomingCents > 0n
    ? Math.max(0, Math.min(100, Number((data.totalCents * 100n) / data.upcomingCents)))
    : 100;
  const metadata = ["Actualizado ahora", "ARS", "Personal", "Información completa"] as const;

  return {
    rail: { items: metadata, state: "complete", wrap: "truncate" },
    banner: null,
    hero: hasAccounts ? {
      scenario: data.totalCents < 0n ? "attention" : "stable",
      stateText: data.totalCents < 0n ? "Tu posición necesita atención." : "Tu posición real está registrada.",
      value: formatCents(data.totalCents < 0n ? -data.totalCents : data.totalCents),
      valuePrefix: data.totalCents < 0n ? "-$" : "$",
      valueLabel: "Patrimonio registrado",
      coverage: {
        title: "Próximos 7 días",
        value: coverage,
        leftSummary: data.upcomingCents > 0n ? `${coverage}% cubierto` : "Sin pagos pendientes",
        rightSummary: `$${formatCents(data.upcomingCents)}`,
        state: coverage < 100 ? "atRisk" : "stable",
      },
    } : {
      scenario: "new",
      stateText: "Empecemos por tu base real.",
      valueLabel: "Creá tu primera cuenta y cargá su saldo inicial.",
    },
    evidence: hasAccounts ? {
      status: "complete",
      title: "Patrimonio registrado",
      subtitle: "Saldo inicial más movimientos confirmados",
      lines: data.accounts.map((account) => ({
        id: account.id,
        label: account.name,
        amount: Number(account.balanceCents),
        displayValue: formatCents(account.balanceCents < 0n ? -account.balanceCents : account.balanceCents),
        valuePrefix: "$",
        ...(account.balanceCents < 0n ? { sign: "-" as const } : {}),
      })),
      total: {
        label: "Patrimonio",
        amount: Number(data.totalCents),
        displayValue: formatCents(data.totalCents < 0n ? -data.totalCents : data.totalCents),
        valuePrefix: data.totalCents < 0n ? "-$" : "$",
      },
      metadata,
    } : null,
    stability: {
      children: hasAccounts
        ? "Cada importe proviene de saldos iniciales y movimientos no anulados."
        : "Sin cuentas todavía no hay una lectura financiera que mostrar.",
      container: "none",
      kind: data.totalCents < 0n ? "attention" : "neutral",
    },
    actions: hasAccounts ? {
      primary: "register",
      primaryLabel: "Registrar movimiento",
      secondaryActions: [
        { id: "history", label: "Ver historial" },
        { id: "upcoming", label: "Próximos pagos" },
        { id: "accounts", label: "Cuentas" },
      ],
      state: "reduced",
    } : {
      primary: "add-first-account",
      primaryLabel: "Crear primera cuenta",
      secondaryActions: [
        { id: "history", label: "Ver historial" },
        { id: "upcoming", label: "Próximos pagos" },
      ],
      state: "reduced",
    },
    position: {
      title: "Resumen del mes",
      rows: [
        { label: "Ingresos", value: formatCents(data.incomeCents), valuePrefix: "$" },
        { label: "Gastos", value: formatCents(data.expenseCents), valuePrefix: "$" },
        {
          label: "Balance mensual",
          value: formatCents(data.monthlyBalanceCents < 0n ? -data.monthlyBalanceCents : data.monthlyBalanceCents),
          valuePrefix: data.monthlyBalanceCents < 0n ? "-$" : "$",
          state: data.monthlyBalanceCents < 0n ? "attention" : "default",
        },
      ],
    },
    operational: [
      {
        title: "Próximos pagos",
        actionLabel: "Ver todos",
        actionHref: "/proximo",
        rows: data.upcoming.length
          ? data.upcoming.map((payment) => ({
              kind: "navigable" as const,
              label: payment.concept,
              supportingLabel: `${payment.dueOn} · ${payment.accountName}`,
              value: payment.amount,
              valuePrefix: "$",
              href: `/proximo/${payment.id}`,
            }))
          : [{ label: "Sin pagos pendientes", value: "0", valuePrefix: "$" }],
      },
      {
        title: "Últimos movimientos",
        actionLabel: "Ver historial",
        actionHref: "/movimientos",
        rows: data.recent.length
          ? data.recent.map((movement) => ({
              kind: "navigable" as const,
              label: movement.description,
              supportingLabel: `${movement.occurredOn} · ${movement.accountName}${movement.voided ? " · Anulado" : ""}`,
              value: movement.amount,
              valuePrefix: movement.type === "EXPENSE" ? "-$" : movement.type === "INCOME" ? "+$" : "$",
              href: `/movimientos/${movement.id}`,
              state: movement.voided ? "partial" as const : "default" as const,
            }))
          : [{ label: "Todavía no hay movimientos", value: "0", valuePrefix: "$" }],
      },
    ],
    reserve: data.upcomingCents > 0n ? {
      title: "Compromisos próximos",
      amount: formatCents(data.upcomingCents),
      amountPrefix: "$",
      purposeLine: "Pagos pendientes con vencimiento dentro de los próximos siete días.",
      priority: coverage < 100 ? "highlighted" : "normal",
      state: "active",
    } : null,
    information: {
      title: "Fuente de esta lectura",
      primaryLine: "No usa saldos editables ni datos simulados.",
      causalLine: "Los saldos se derivan del saldo inicial y del ledger, excluyendo movimientos anulados.",
      linkLabel: "Abrir historial",
      linkHref: "/movimientos",
      state: "complete",
    },
  };
}
