import "server-only";
import { formatCents } from "../../../lib/finance/domain";
import { getDashboardData, getInvestments } from "../../../lib/finance/data";
import type { NowViewModel } from "../model";

async function getInvestmentsSummary(): Promise<NonNullable<NowViewModel["investments"]> | null> {
  try {
    const investments = await getInvestments();
    if (!investments.length) {
      return { hasInvestments: false, value: "0", valuePrefix: "$", deltaLabel: "", deltaState: "neutral", href: "/inversiones" };
    }
    const valueCents = investments.reduce((sum, item) => sum + item.currentValueCents, 0n);
    const investedCents = investments.reduce((sum, item) => sum + item.investedCents, 0n);
    const deltaCents = valueCents - investedCents;
    const percent = investedCents === 0n ? 0 : Number((deltaCents * 10000n) / investedCents) / 100;
    const sign = percent > 0 ? "+" : percent < 0 ? "-" : "";
    return {
      hasInvestments: true,
      value: formatCents(valueCents),
      valuePrefix: "$",
      deltaLabel: `${sign}${Math.abs(percent).toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`,
      deltaState: deltaCents > 0n ? "positive" : deltaCents < 0n ? "negative" : "neutral",
      href: "/inversiones",
    };
  } catch {
    // Tabla de inversiones aún no migrada: no romper el dashboard.
    return null;
  }
}

export async function getNowModel(): Promise<NowViewModel> {
  const [data, investments] = await Promise.all([getDashboardData(), getInvestmentsSummary()]);
  const hasAccounts = data.accounts.length > 0;
  const coverage = data.upcomingCents > 0n
    ? Math.max(0, Math.min(100, Number((data.totalCents * 100n) / data.upcomingCents)))
    : 100;
  const metadata = ["Actualizado ahora", "ARS", "Personal", "Información completa"] as const;
  const trendMaximum = data.monthlyHistory.reduce(
    (maximum, point) => point.incomeCents > maximum
      ? point.incomeCents
      : point.expenseCents > maximum
        ? point.expenseCents
        : maximum,
    0n,
  );
  const trendPercent = (value: bigint) => value === 0n || trendMaximum === 0n
    ? 4
    : Math.max(10, Number((value * 100n) / trendMaximum));
  const accountTypeLabels: Record<string, string> = {
    CASH: "Efectivo",
    BANK: "Banco",
    WALLET: "Billetera",
    SAVINGS: "Ahorro",
    OTHER: "Otra",
  };

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
      ],
      state: "default",
    } : {
      primary: "add-first-account",
      primaryLabel: "Crear primera cuenta",
      secondaryActions: [
        { id: "history", label: "Ver historial" },
        { id: "upcoming", label: "Próximos pagos" },
      ],
      state: "default",
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
    accounts: data.accounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: accountTypeLabels[account.type] ?? "Cuenta",
      balance: formatCents(account.balanceCents < 0n ? -account.balanceCents : account.balanceCents),
      balancePrefix: account.balanceCents < 0n ? "-$" : "$",
      state: account.balanceCents < 0n ? "attention" : "stable",
    })),
    trend: data.monthlyHistory.map((point) => {
      const netCents = point.incomeCents - point.expenseCents;
      return {
        month: point.month,
        label: point.label,
        income: formatCents(point.incomeCents),
        expense: formatCents(point.expenseCents),
        net: formatCents(netCents < 0n ? -netCents : netCents),
        netPrefix: netCents < 0n ? "-$" : "+$",
        netState: netCents < 0n ? "negative" as const : netCents > 0n ? "positive" as const : "neutral" as const,
        incomePercent: trendPercent(point.incomeCents),
        expensePercent: trendPercent(point.expenseCents),
      };
    }),
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
    investments,
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
