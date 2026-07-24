import "server-only";
import { formatCents } from "../../../lib/finance/domain";
import { describeDuePhraseAR, describeDueDateAR, describeGroup } from "../../../lib/finance/upcomingDate";
import { getUpcomingData } from "../../../lib/finance/data";
import { normalizeListPath } from "../../../lib/navigation/scrollRestoration";
import {
  accountsMoneyCents,
  buildTimeline,
  computeCoverage,
  paymentState,
  selectCommitments,
  type PaymentState,
} from "../../../lib/finance/projection";
import type { NextPayment, NextTimelineGroup, NextViewModel } from "../model";

const money = (cents: bigint): string => formatCents(cents < 0n ? -cents : cents);
const plural = (count: number, one: string, many: string): string => (count === 1 ? one : many);

const STATE_LABELS: Record<PaymentState, string> = {
  overdue: "Vencido",
  "due-today": "Vence hoy",
  pending: "Pendiente",
  paid: "Pagado",
};

/**
 * Saldo posterior en palabras. Un saldo negativo no se muestra como
 * "-$12.000 disponibles": se dice qué faltaría.
 */
function balanceAfterLabel(cents: bigint, single: boolean): string {
  if (cents < 0n) {
    return single
      ? `Después de este pago faltarían $${money(cents)}.`
      : `Después de estos pagos faltarían $${money(cents)}.`;
  }
  return single
    ? `Después de este pago quedarían aproximadamente $${money(cents)}.`
    : `Después de estos pagos quedarían aproximadamente $${money(cents)}.`;
}

export async function getNextModel(): Promise<NextViewModel> {
  const data = await getUpcomingData();
  const baseCents = accountsMoneyCents(data.accounts);
  const timeline = buildTimeline(data.pending, data.today, baseCents);
  const coverage = computeCoverage(baseCents, timeline.pendingCents);
  const selection = selectCommitments(data.pending, data.today);
  const overdueCount = selection.overdue.length;
  const hasPending = data.pending.length > 0;

  // Cada detalle vuelve a la lista con su posición: mismo contrato que /movimientos.
  const restorationKey = normalizeListPath("/proximo", {});
  const detailHref = (paymentId: string) =>
    `/proximo/${paymentId}?volver=${encodeURIComponent(restorationKey)}`;

  const railComplete = data.hasActiveAccounts;
  const rail = {
    items: [
      "Próximos pagos",
      "ARS",
      "Personal",
      railComplete ? "Información completa" : "Sin cuentas activas",
    ] as const,
    state: railComplete ? ("complete" as const) : ("partial" as const),
    wrap: "truncate" as const,
  };

  const groups: NextTimelineGroup[] = timeline.groups.map((group) => {
    const payments: NextPayment[] = group.entries.map((entry) => {
      const state = paymentState(entry.payment.dueOn, data.today, "PENDING");
      return {
        id: entry.payment.id,
        concept: entry.payment.concept,
        href: detailHref(entry.payment.id),
        amount: money(entry.payment.amountCents),
        amountPrefix: "$",
        dateLabel: describeDueDateAR(entry.payment.dueOn, data.today),
        accountName: entry.payment.accountName,
        state: state === "paid" ? "pending" : state,
        stateLabel: STATE_LABELS[state],
        balanceAfterLabel: balanceAfterLabel(entry.balanceAfterCents, true),
        balanceAfterState: entry.balanceAfterCents < 0n ? "attention" : "default",
      };
    });

    return {
      id: group.id,
      title: describeGroup(group.id, data.today),
      summary: `${group.entries.length} ${plural(group.entries.length, "pago", "pagos")} · $${money(group.totalCents)}`,
      tone: group.id === "overdue" ? "overdue" : group.id === "today" ? "today" : "normal",
      payments,
      balanceAfterLabel: balanceAfterLabel(group.balanceAfterCents, group.entries.length === 1),
    };
  });

  const coverageBlock: NextViewModel["coverage"] = hasPending
    ? {
        headline: data.hasActiveAccounts
          ? `Tenés cubiertos $${money(coverage.coveredCents)} de $${money(timeline.pendingCents)}.`
          : "No podemos calcular cobertura sin cuentas.",
        detail: !data.hasActiveAccounts
          ? "Creá una cuenta con su saldo para saber si estos pagos están cubiertos."
          : coverage.missingCents > 0n
            ? `Faltan $${money(coverage.missingCents)} para cubrir los pagos cargados.`
            : coverage.surplusCents > 0n
              ? `Los pagos cargados están cubiertos y quedarían $${money(coverage.surplusCents)}.`
              : "Los pagos cargados están cubiertos.",
        meter: {
          title: "Cobertura de los pagos cargados",
          value: data.hasActiveAccounts ? coverage.percent : 0,
          leftSummary: coverage.missingCents > 0n ? `Faltan $${money(coverage.missingCents)}` : "Cubierto",
          rightSummary: `$${money(timeline.pendingCents)}`,
          state: !data.hasActiveAccounts ? "empty" : coverage.missingCents > 0n ? "atRisk" : "stable",
          accessibleLabel: data.hasActiveAccounts
            ? `Cobertura: $${money(coverage.coveredCents)} cubiertos de $${money(timeline.pendingCents)} en pagos cargados.`
            : "Cobertura no disponible: no hay cuentas con saldo.",
        },
        note: "Los importes de próximos pagos son los que vos cargaste, así que esta cobertura es aproximada.",
      }
    : null;

  return {
    rail,
    banner:
      overdueCount > 0
        ? {
            title: `Hay ${overdueCount} ${plural(overdueCount, "pago vencido", "pagos vencidos")}.`,
            detail: `${selection.overdue[0]!.concept} venció ${describeDuePhraseAR(selection.overdue[0]!.dueOn, data.today)} y todavía figura pendiente.`,
            actionLabel: "Revisar pago",
            actionId: "overdue",
          }
        : null,
    hero: hasPending
      ? {
          scenario: coverage.missingCents > 0n || overdueCount > 0 ? "attention" : "stable",
          stateText:
            overdueCount > 0
              ? `Hay ${overdueCount} ${plural(overdueCount, "pago vencido", "pagos vencidos")}.`
              : coverage.missingCents > 0n
                ? "Los pagos cargados superan el dinero de tus cuentas."
                : "Tus próximos pagos están cubiertos.",
          value: money(timeline.pendingCents),
          valuePrefix: "$",
          valueLabel: "Pagos pendientes cargados",
          inlineNote: balanceAfterLabel(timeline.finalBalanceCents, data.pending.length === 1),
          coverage: {
            title: "Cobertura de los pagos cargados",
            value: data.hasActiveAccounts ? coverage.percent : 0,
            leftSummary: coverage.missingCents > 0n ? `Faltan $${money(coverage.missingCents)}` : "Cubierto",
            rightSummary: `$${money(timeline.pendingCents)}`,
            state: !data.hasActiveAccounts ? "empty" : coverage.missingCents > 0n ? "atRisk" : "stable",
            accessibleLabel: data.hasActiveAccounts
              ? `Cobertura: $${money(coverage.coveredCents)} cubiertos de $${money(timeline.pendingCents)} en pagos cargados.`
              : "Cobertura no disponible: no hay cuentas con saldo.",
          },
        }
      : {
          scenario: "new",
          stateText: "No hay pagos próximos cargados.",
          valueLabel: "Cargá un pago previsto para verlo con anticipación.",
        },
    evidence: hasPending
      ? {
          status: "complete",
          title: "Pagos pendientes",
          subtitle: "En orden de vencimiento",
          summary: `Con $${money(baseCents)} en tus cuentas: ${balanceAfterLabel(timeline.finalBalanceCents, data.pending.length === 1).toLowerCase()}`,
          lines: timeline.entries.map((entry) => ({
            id: entry.payment.id,
            label: `${entry.payment.concept} · ${describeDueDateAR(entry.payment.dueOn, data.today)}`,
            amount: Number(entry.payment.amountCents),
            displayValue: money(entry.payment.amountCents),
            valuePrefix: "$",
          })),
          total: {
            label: "Pendiente",
            amount: Number(timeline.pendingCents),
            displayValue: money(timeline.pendingCents),
            valuePrefix: "$",
          },
          metadata: rail.items,
        }
      : null,
    coverage: coverageBlock,
    stability: {
      children: hasPending
        ? "Un pago previsto no es un movimiento: recién descuenta de tus cuentas cuando lo confirmás."
        : "Sin pagos cargados, tu proyección coincide con el dinero que ya tenés.",
      container: "none",
      kind: overdueCount > 0 || coverage.missingCents > 0n ? "attention" : "stable",
    },
    actions: data.hasActiveAccounts
      ? {
          primary: overdueCount > 0 ? "resolve" : "register",
          primaryLabel: overdueCount > 0 ? "Revisar pago vencido" : "Agregar pago previsto",
          secondaryActions: [
            { id: "now", label: "Volver a Ahora" },
            { id: "history", label: "Ver movimientos" },
          ],
          state: "default",
        }
      : {
          primary: "add-first-account",
          primaryLabel: "Crear una cuenta",
          secondaryActions: [
            { id: "now", label: "Volver a Ahora" },
            { id: "history", label: "Ver movimientos" },
          ],
          state: "default",
        },
    timeline: groups,
    empty: hasPending
      ? null
      : {
          title: "No hay pagos próximos cargados.",
          description: "Tu proyección coincide con el dinero actual. Agregá un pago previsto para anticiparte.",
          actionLabel: data.hasActiveAccounts ? "Agregar pago previsto" : "Crear una cuenta",
          actionHref: data.hasActiveAccounts ? "/proximo/nuevo" : "/cuentas/nueva",
        },
    confirmed: data.paid.length
      ? {
          title: "Pagos confirmados",
          caption: "Ya son movimientos reales: no participan de la cobertura ni de la proyección.",
          rows: data.paid.map((payment) => ({
            kind: "navigable" as const,
            label: payment.concept,
            supportingLabel: `${describeDueDateAR(payment.dueOn, data.today)} · ${payment.accountName}`,
            status: "Pagado",
            value: money(payment.amountCents),
            valuePrefix: "$",
            href: detailHref(payment.id),
            state: "partial" as const,
          })),
        }
      : null,
    information: {
      title: "Qué muestra esta pantalla",
      primaryLine: `${data.pending.length} ${plural(data.pending.length, "pago pendiente", "pagos pendientes")}; ${data.paidCount} ${plural(data.paidCount, "confirmado", "confirmados")}.`,
      causalLine:
        "El saldo posterior descuenta solamente pagos pendientes, en orden de vencimiento. Confirmar un pago crea el movimiento una sola vez.",
      linkLabel: data.hasActiveAccounts ? "Agregar pago previsto" : "Crear una cuenta",
      linkHref: data.hasActiveAccounts ? "/proximo/nuevo" : "/cuentas/nueva",
      state: railComplete ? "complete" : "partial",
    },
    restorationKey,
  };
}
