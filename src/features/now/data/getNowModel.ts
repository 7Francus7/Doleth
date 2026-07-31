import "server-only";
import { formatCents } from "../../../lib/finance/domain";
import { describeDateAR } from "../../../lib/finance/movementDate";
import { describeDuePhraseAR, describeDueDateAR } from "../../../lib/finance/upcomingDate";
import { getInvestments, getNowData } from "../../../lib/finance/data";
import {
  accountsMoneyCents,
  archivedMoneyCents,
  computeCoverage,
  patrimonyCents,
  projectBalance,
  selectCommitments,
  selectNowState,
  type NowState,
} from "../../../lib/finance/projection";
import type { NowProjection, NowViewModel } from "../model";

const money = (cents: bigint): string => formatCents(cents < 0n ? -cents : cents);
const signed = (cents: bigint): string => (cents < 0n ? "-$" : "$");
const plural = (count: number, one: string, many: string): string => (count === 1 ? one : many);

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CASH: "Efectivo",
  BANK: "Banco",
  WALLET: "Billetera",
  SAVINGS: "Ahorro",
  OTHER: "Otra",
};

async function getInvestmentsSummary(userId: string): Promise<NonNullable<NowViewModel["investments"]> | null> {
  try {
    const investments = await getInvestments(userId);
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
    // Inversiones es un dominio secundario: su ausencia no puede romper /ahora.
    return null;
  }
}

/** Una sola acción principal por estado. Nunca dos caminos compitiendo. */
function primaryAction(state: NowState): NowViewModel["actions"] {
  const secondary = [
    { id: "upcoming", label: "Ver próximos pagos" },
    { id: "history", label: "Ver movimientos" },
  ] as const;

  if (state === "no-accounts") {
    return { primary: "add-first-account", primaryLabel: "Crear una cuenta", secondaryActions: secondary, state: "default" };
  }
  if (state === "attention" || state === "uncovered") {
    return { primary: "resolve", primaryLabel: "Revisar próximos pagos", secondaryActions: secondary, state: "default" };
  }
  return { primary: "register", primaryLabel: "Registrar un movimiento", secondaryActions: secondary, state: "default" };
}

export async function getNowModel(userId: string): Promise<NowViewModel> {
  const [data, investments] = await Promise.all([getNowData(userId), getInvestmentsSummary(userId)]);

  const hasAccounts = data.accounts.length > 0;
  const baseCents = accountsMoneyCents(data.accounts);
  const totalPatrimonyCents = patrimonyCents(data.accounts);
  const archivedCents = archivedMoneyCents(data.accounts);
  const archivedCount = data.accounts.filter((account) => account.archived).length;
  const activeCount = data.accounts.length - archivedCount;
  const hasArchived = archivedCount > 0;

  const selection = selectCommitments(data.pending, data.today);
  const projection = projectBalance(baseCents, selection);
  const coverage = computeCoverage(baseCents, selection.committedCents);
  const state = selectNowState({
    hasAccounts,
    overdueCount: selection.overdue.length,
    coverage,
    hasMovements: data.movementCount > 0,
    hasCommitments: projection.hasCommitments,
  });

  const horizonLabel = `hasta el ${describeDueDateAR(projection.horizonEnd, data.today).toLowerCase()}`;
  const committedLine = projection.hasCommitments
    ? `Hay $${money(projection.committedCents)} comprometidos ${horizonLabel}.`
    : "No hay pagos próximos cargados.";

  // El rail declara la calidad de la lectura antes que cualquier número.
  const informationComplete = data.movementCount > 0 && projection.hasCommitments && data.recent !== null;
  const rail = {
    items: [
      "Dinero en cuentas",
      "ARS",
      hasArchived ? "Incluye cuentas archivadas aparte" : "Personal",
      informationComplete ? "Información completa" : "Información incompleta",
    ] as const,
    state: informationComplete ? ("complete" as const) : ("partial" as const),
    wrap: "truncate" as const,
  };

  const stateText: Record<NowState, string> = {
    "no-accounts": "Empezá por representar dónde está tu dinero.",
    attention: `Hay ${selection.overdue.length} ${plural(selection.overdue.length, "pago vencido", "pagos vencidos")}.`,
    uncovered: "Los pagos cargados superan el dinero de tus cuentas.",
    incomplete: "Esta lectura usa solamente lo que cargaste.",
    stable: "Tu situación está registrada y al día.",
  };

  const projectionBlock: NowProjection | null = hasAccounts
    ? {
        title: "Después de pagar",
        // Un proyectado negativo no es un saldo: es un faltante, y se dice así.
        headline: projection.hasCommitments
          ? projection.projectedCents < 0n
            ? `Los pagos cargados superan tu dinero: faltarían $${money(projection.projectedCents)}.`
            : `Después de los pagos cargados quedarían aproximadamente $${money(projection.projectedCents)}.`
          : "Sin pagos cargados, tu proyección coincide con el dinero actual.",
        amount: money(projection.projectedCents),
        amountPrefix: signed(projection.projectedCents),
        amountState: projection.projectedCents < 0n ? "attention" : "default",
        rows: [
          { label: "Dinero en tus cuentas", value: money(baseCents), valuePrefix: signed(baseCents) },
          {
            label: "Comprometido",
            value: money(projection.committedCents),
            valuePrefix: projection.committedCents > 0n ? "-$" : "$",
            state: "default" as const,
          },
          {
            label: projection.projectedCents < 0n ? "Faltarían" : "Quedarían",
            value: money(projection.projectedCents),
            valuePrefix: signed(projection.projectedCents),
            state: projection.projectedCents < 0n ? ("attention" as const) : ("default" as const),
          },
        ],
        note: projection.hasCommitments
          ? `Incluye ${projection.includedCount} ${plural(projection.includedCount, "pago cargado", "pagos cargados")} con vencimiento ${horizonLabel}. Los importes de próximos pagos son previstos, así que el resultado es aproximado.`
          : `Sin próximos pagos cargados ${horizonLabel}.`,
        ...(projection.excludedCount > 0
          ? {
              excludedNote: `${plural(projection.excludedCount, "Queda", "Quedan")} ${projection.excludedCount} ${plural(projection.excludedCount, "pago", "pagos")} por $${money(projection.excludedCents)} después de esa fecha: ${plural(projection.excludedCount, "no está incluido", "no están incluidos")} acá.`,
            }
          : {}),
        linkLabel: "Ver próximos pagos",
        linkHref: "/proximo",
      }
    : null;

  // La evidencia reconcilia con el número visible: solo cuentas activas, que son
  // las que componen "dinero en tus cuentas". Lo archivado se declara en el resumen.
  const evidenceLines = data.accounts
    .filter((account) => !account.archived)
    .map((account) => ({
      id: account.id,
      label: account.name,
      amount: Number(account.balanceCents),
      displayValue: money(account.balanceCents),
      valuePrefix: "$",
      ...(account.balanceCents < 0n ? { sign: "-" as const } : {}),
    }));

  return {
    rail,
    banner:
      selection.overdue.length > 0
        ? {
            title: `Hay ${selection.overdue.length} ${plural(selection.overdue.length, "pago vencido", "pagos vencidos")}.`,
            detail: `${selection.overdue[0]!.concept} venció ${describeDuePhraseAR(selection.overdue[0]!.dueOn, data.today)} y todavía figura pendiente.`,
            actionLabel: "Revisar pago",
            actionId: "overdue",
          }
        : null,
    hero: hasAccounts
      ? {
          scenario: state === "attention" || state === "uncovered" ? "attention" : "stable",
          stateText: stateText[state],
          value: money(baseCents),
          valuePrefix: signed(baseCents),
          valueLabel: "Dinero en tus cuentas",
          inlineNote: committedLine,
          coverage: {
            title: "Cobertura de lo comprometido",
            value: coverage.percent,
            leftSummary: coverage.hasCommitments
              ? coverage.missingCents > 0n
                ? `Faltan $${money(coverage.missingCents)}`
                : "Cubierto"
              : "Sin pagos cargados",
            rightSummary: `$${money(projection.committedCents)}`,
            state: coverage.missingCents > 0n ? "atRisk" : "stable",
            accessibleLabel: coverage.hasCommitments
              ? `Cobertura: $${money(coverage.coveredCents)} cubiertos de $${money(projection.committedCents)} comprometidos.`
              : "Sin pagos próximos cargados.",
          },
        }
      : {
          scenario: "new",
          stateText: stateText["no-accounts"],
          valueLabel: "Creá una cuenta para que Doleth pueda mostrar tu situación actual.",
        },
    evidence: hasAccounts
      ? {
          status: "complete",
          title: "Cómo se calculó",
          subtitle: "Saldos de tus cuentas activas, hoy",
          summary: hasArchived
            ? `Tu patrimonio total es $${money(totalPatrimonyCents)}: incluye $${money(archivedCents)} en cuentas archivadas, que no entran en esta lectura operativa.`
            : `${committedLine} La proyección resta esos compromisos del dinero en tus cuentas.`,
          lines: evidenceLines,
          total: {
            label: "Dinero en tus cuentas",
            amount: Number(baseCents),
            displayValue: money(baseCents),
            valuePrefix: signed(baseCents),
          },
          metadata: rail.items,
        }
      : null,
    projection: projectionBlock,
    stability: {
      children: hasAccounts
        ? "Cada importe sale de tus saldos iniciales y de los movimientos no anulados. Los próximos pagos no descuentan nada hasta que los confirmes."
        : "Sin cuentas todavía no hay una lectura financiera que mostrar.",
      container: "none",
      kind: state === "attention" || state === "uncovered" ? "attention" : "neutral",
    },
    actions: primaryAction(state),
    position: {
      title: "Este mes",
      rows: [
        { label: "Ingresos", value: money(data.incomeCents), valuePrefix: "$" },
        { label: "Gastos", value: money(data.expenseCents), valuePrefix: "$" },
        {
          label: "Diferencia",
          value: money(data.monthlyBalanceCents),
          valuePrefix: signed(data.monthlyBalanceCents),
          state: data.monthlyBalanceCents < 0n ? "attention" : "default",
        },
      ],
    },
    accounts: data.accounts
      .filter((account) => !account.archived)
      .map((account) => ({
        id: account.id,
        name: account.name,
        type: ACCOUNT_TYPE_LABELS[account.type] ?? "Cuenta",
        balance: money(account.balanceCents),
        balancePrefix: signed(account.balanceCents),
        state: account.balanceCents < 0n ? "attention" : "stable",
      })),
    operational: [
      {
        title: "Próximos pagos",
        actionLabel: "Ver todos",
        actionHref: "/proximo",
        rows: selection.included.length
          ? selection.included.slice(0, 4).map((payment) => ({
              kind: "navigable" as const,
              label: payment.concept,
              supportingLabel: `${describeDueDateAR(payment.dueOn, data.today)} · ${payment.accountName}`,
              value: money(payment.amountCents),
              valuePrefix: "$",
              href: `/proximo/${payment.id}`,
              state: payment.dueOn < data.today ? ("attention" as const) : ("default" as const),
            }))
          : [{ label: "No hay pagos próximos cargados", value: "0", valuePrefix: "$" }],
      },
      {
        title: "Movimientos recientes",
        actionLabel: "Ver historial",
        actionHref: "/movimientos",
        ...(data.recent === null
          ? {
              notice: "No pudimos cargar los movimientos recientes. Tu saldo principal sigue disponible.",
              rows: [] as const,
            }
          : {
              rows: data.recent.length
                ? data.recent.map((movement) => ({
                    kind: "navigable" as const,
                    label: movement.description,
                    supportingLabel: `${describeDateAR(movement.occurredOn, data.today)} · ${movement.accountName}${movement.voided ? (movement.corrected ? " · Corregido" : " · Anulado") : ""}`,
                    value: money(movement.amountCents),
                    valuePrefix: movement.type === "EXPENSE" ? "-$" : movement.type === "INCOME" ? "+$" : "$",
                    href: `/movimientos/${movement.id}`,
                    state: movement.voided ? ("partial" as const) : ("default" as const),
                  }))
                : [{ label: "Todavía no registraste movimientos", value: "0", valuePrefix: "$" }],
            }),
      },
    ],
    investments,
    information: {
      title: "De dónde sale esta lectura",
      primaryLine: hasAccounts
        ? `${activeCount} ${plural(activeCount, "cuenta activa", "cuentas activas")}${archivedCount > 0 ? ` y ${archivedCount} ${plural(archivedCount, "archivada", "archivadas")} fuera de esta lectura` : ""}; ${projection.includedCount} ${plural(projection.includedCount, "pago próximo considerado", "pagos próximos considerados")}.`
        : "Todavía no hay cuentas registradas.",
      causalLine:
        "Los saldos se derivan del saldo inicial y del ledger, excluyendo movimientos anulados. Las transferencias entre tus cuentas no alteran el total.",
      linkLabel: "Ver movimientos",
      linkHref: "/movimientos",
      state: informationComplete ? "complete" : "partial",
    },
  };
}
