import "server-only";
import { formatCents, formatDateAR } from "../../../lib/finance/domain";
import { getAccountsWithBalances, getUpcomingPayments } from "../../../lib/finance/data";
import type { NextViewModel } from "../model";

export async function getNextModel(): Promise<NextViewModel> {
  const [{ payments, accounts }, balances] = await Promise.all([getUpcomingPayments(), getAccountsWithBalances()]);
  const pending = payments.filter((payment) => payment.status === "PENDING");
  const paid = payments.filter((payment) => payment.status === "PAID").slice(0, 5);
  const pendingCents = pending.reduce((sum, payment) => sum + payment.estimatedCents, 0n);
  const availableCents = balances.reduce((sum, account) => sum + account.balanceCents, 0n);
  const coverage = pendingCents > 0n ? Math.max(0, Math.min(100, Number((availableCents * 100n) / pendingCents))) : 100;
  const metadata = ["Próximos pagos", "ARS", "Personal", "Información completa"] as const;

  return {
    rail: { items: metadata, state: "complete", wrap: "truncate" },
    banner: null,
    hero: pending.length ? {
      scenario: coverage < 100 ? "attention" : "stable",
      stateText: coverage < 100 ? "Hay pagos que todavía no están cubiertos." : "Tus próximos pagos están visibles.",
      value: formatCents(pendingCents),
      valuePrefix: "$",
      valueLabel: "Pendiente por pagar",
      coverage: {
        title: "Cobertura con patrimonio actual",
        value: coverage,
        leftSummary: `${coverage}% cubierto`,
        rightSummary: `$${formatCents(pendingCents)}`,
        state: coverage < 100 ? "atRisk" : "stable",
      },
    } : {
      scenario: "new",
      stateText: "No hay pagos pendientes.",
      valueLabel: "Registrá el próximo compromiso para verlo con anticipación.",
    },
    evidence: pending.length ? {
      status: "complete",
      title: "Pagos pendientes",
      subtitle: "Compromisos registrados",
      lines: pending.map((payment) => ({
        id: payment.id,
        label: payment.concept,
        amount: Number(payment.estimatedCents),
        displayValue: formatCents(payment.estimatedCents),
        valuePrefix: "$",
      })),
      total: { label: "Pendiente", amount: Number(pendingCents), displayValue: formatCents(pendingCents), valuePrefix: "$" },
      metadata,
    } : null,
    stability: {
      children: pending.length ? "Cada pago puede convertirse una sola vez en un gasto real." : "Nada pendiente no significa nada perdido: la lista está al día.",
      container: "none",
      kind: coverage < 100 ? "attention" : "stable",
    },
    actions: accounts.length ? {
      primary: "register",
      primaryLabel: "Registrar próximo pago",
      secondaryActions: [{ id: "history", label: "Ver movimientos" }, { id: "accounts", label: "Ver cuentas" }],
      state: "default",
    } : {
      primary: "add-first-account",
      primaryLabel: "Crear primera cuenta",
      secondaryActions: [{ id: "history", label: "Ver movimientos" }, { id: "accounts", label: "Ver cuentas" }],
      state: "default",
    },
    confirmed: paid.length ? {
      title: "Pagados",
      rows: paid.map((payment) => ({
        kind: "navigable" as const,
        label: payment.concept,
        supportingLabel: `${formatDateAR(payment.dueOn)} · ${payment.plannedAccount.name}`,
        value: formatCents(payment.estimatedCents),
        valuePrefix: "$",
        href: `/proximo/${payment.id}`,
      })),
    } : null,
    expected: pending.length ? {
      title: "Pendientes",
      rows: pending.map((payment) => ({
        kind: "navigable" as const,
        label: payment.concept,
        supportingLabel: `${formatDateAR(payment.dueOn)} · ${payment.plannedAccount.name}`,
        value: formatCents(payment.estimatedCents),
        valuePrefix: "$",
        href: `/proximo/${payment.id}`,
      })),
    } : null,
    risk: null,
    information: {
      title: "Estado de compromisos",
      primaryLine: `${pending.length} pendiente${pending.length === 1 ? "" : "s"}; ${paid.length} convertido${paid.length === 1 ? "" : "s"} en movimiento.`,
      causalLine: "Al marcar un pago como pagado, la conversión y el asiento se guardan en una misma transacción.",
      linkLabel: "Registrar próximo pago",
      linkHref: accounts.length ? "/proximo/nuevo" : "/cuentas/nueva",
      state: "complete",
    },
  };
}
