import "server-only";
import { formatCents } from "../../../lib/finance/domain";
import { describeDateAR } from "../../../lib/finance/movementDate";
import { describeDuePhraseAR, describeDueDateAR } from "../../../lib/finance/upcomingDate";
import { getInvestments, getNowData } from "../../../lib/finance/data";
import { describeEquivalent, describeMissing, describeRate } from "../../../lib/finance/display";
import { CURRENCY_SYMBOLS } from "../../../lib/finance/currency";
import { accountTypeLabel } from "../../../lib/finance/accountKind";
import {
  accountsMoneyCents,
  archivedMoneyCents,
  debtCents,
  computeCoverage,
  patrimonyCents,
  projectBalance,
  selectCommitments,
  selectNowState,
  type NowState,
} from "../../../lib/finance/projection";
import type { NowProjection, NowViewModel } from "../model";

const money = (cents: bigint): string => formatCents(cents < 0n ? -cents : cents);
const plural = (count: number, one: string, many: string): string => (count === 1 ? one : many);

/**
 * Signo y símbolo de una fila de movimiento, en la moneda en que ocurrió.
 *
 * Una fila de evidencia no se convierte: un gasto de US$ 50 es US$ 50 y no su
 * equivalente de hoy en pesos. Si cada fila se recalculara con la cotización
 * vigente, el historial cambiaría de números solo, y un historial que cambia
 * solo deja de ser evidencia de nada.
 */
/** Signo y símbolo del saldo de una cuenta, en su propia moneda. */
const accountPrefix = (cents: bigint, currency: string): string => {
  const symbol = CURRENCY_SYMBOLS[currency as "ARS"] ?? currency;
  return cents < 0n ? `-${symbol}` : symbol;
};

const movementPrefix = (type: "EXPENSE" | "INCOME" | "TRANSFER", currency: string): string => {
  const symbol = CURRENCY_SYMBOLS[currency as "ARS"] ?? currency;
  if (type === "EXPENSE") return `-${symbol}`;
  if (type === "INCOME") return `+${symbol}`;
  return symbol;
};



async function getInvestmentsSummary(userId: string): Promise<NonNullable<NowViewModel["investments"]> | null> {
  try {
    const investments = await getInvestments(userId);
    if (!investments.length) {
      return { hasInvestments: false, value: "0", valuePrefix: "$", deltaLabel: "", deltaState: "neutral", href: "/mi-realidad#inversiones" };
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
      href: "/mi-realidad#inversiones",
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

  // El símbolo sale de la moneda de lectura de la persona, no de una constante:
  // los mismos textos tienen que decir "US$" cuando lee en dólares. `signed`
  // antepone el signo al símbolo y no al revés, porque "-US$ 100" se lee como un
  // importe negativo y "US$ -100" se lee como un error de formato.
  const symbol = data.display.symbol;
  const signed = (cents: bigint): string => (cents < 0n ? `-${symbol}` : symbol);

  const hasAccounts = data.accounts.length > 0;
  const baseCents = accountsMoneyCents(data.accounts);
  const totalPatrimonyCents = patrimonyCents(data.accounts);
  const archivedCents = archivedMoneyCents(data.accounts);
  // Lo que se debe, positivo para poder decirlo en voz alta. Ya está restado del
  // patrimonio por el signo del ledger: acá sólo se lo nombra.
  const owedCents = debtCents(data.accounts);
  const hasDebt = owedCents > 0n;
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
    ? `Hay ${symbol}${money(projection.committedCents)} comprometidos ${horizonLabel}.`
    : "No hay pagos próximos cargados.";

  // Declaración de la lectura multimoneda. `describeMissing` sólo devuelve texto
  // cuando algo quedó sin convertir, así que su presencia es exactamente la
  // señal de que el total no se puede presentar como completo.
  const missingLine = describeMissing(data.display);
  const rateLine = describeRate(data.display);
  // El equivalente en la otra moneda acompaña al número dominante. Es `null`
  // cuando no hay cotización: una equivalencia inventada es peor que ninguna.
  const baseEquivalent = describeEquivalent(baseCents, data.display, data.book);

  // El rail declara la calidad de la lectura antes que cualquier número. La
  // moneda sale de la preferencia de la persona y ya no es una constante: decir
  // "ARS" mientras se muestran dólares sería mentir en el lugar donde el
  // producto promete transparencia.
  const informationComplete =
    data.movementCount > 0 && projection.hasCommitments && data.recent !== null && data.display.complete;
  const rail = {
    items: [
      "Dinero en cuentas",
      data.display.stale ? `${data.display.currency} · cotización desactualizada` : data.display.currency,
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
            ? `Los pagos cargados superan tu dinero: faltarían ${symbol}${money(projection.projectedCents)}.`
            : `Después de los pagos cargados quedarían aproximadamente ${symbol}${money(projection.projectedCents)}.`
          : "Sin pagos cargados, tu proyección coincide con el dinero actual.",
        amount: money(projection.projectedCents),
        amountPrefix: signed(projection.projectedCents),
        amountState: projection.projectedCents < 0n ? "attention" : "default",
        rows: [
          { label: "Dinero en tus cuentas", value: money(baseCents), valuePrefix: signed(baseCents) },
          {
            label: "Comprometido",
            value: money(projection.committedCents),
            valuePrefix: projection.committedCents > 0n ? `-${symbol}` : symbol,
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
              excludedNote: `${plural(projection.excludedCount, "Queda", "Quedan")} ${projection.excludedCount} ${plural(projection.excludedCount, "pago", "pagos")} por ${symbol}${money(projection.excludedCents)} después de esa fecha: ${plural(projection.excludedCount, "no está incluido", "no están incluidos")} acá.`,
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
      valuePrefix: symbol,
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
          ...(baseEquivalent ? { secondaryValue: `≈ ${baseEquivalent}` } : {}),
          // Lo que falta convertir manda sobre lo comprometido: un total que no
          // incluye toda la plata de la persona es lo primero que tiene que
          // saber, antes que cualquier proyección construida sobre él.
          inlineNote: missingLine ?? committedLine,
          coverage: {
            title: "Cobertura de lo comprometido",
            value: coverage.percent,
            leftSummary: coverage.hasCommitments
              ? coverage.missingCents > 0n
                ? `Faltan ${symbol}${money(coverage.missingCents)}`
                : "Cubierto"
              : "Sin pagos cargados",
            rightSummary: `${symbol}${money(projection.committedCents)}`,
            state: coverage.missingCents > 0n ? "atRisk" : "stable",
            accessibleLabel: coverage.hasCommitments
              ? `Cobertura: ${symbol}${money(coverage.coveredCents)} cubiertos de ${symbol}${money(projection.committedCents)} comprometidos.`
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
          // El rail es de cuatro ítems por diseño, así que la cotización usada
          // vive acá: es detalle del cálculo, y este bloque es justamente el que
          // se abre para poder seguirlo.
          subtitle: rateLine ? `Saldos de tus cuentas activas, hoy · ${rateLine}` : "Saldos de tus cuentas activas, hoy",
          // La deuda manda sobre lo archivado: no saber que se deben $240.000
          // cambia una decisión, y tener una cuenta archivada casi nunca.
          summary: hasDebt
            ? `Tu patrimonio total es ${symbol}${money(totalPatrimonyCents)}: este número es sólo el dinero de tus cuentas y no descuenta los ${symbol}${money(owedCents)} que debés en tarjetas.`
            : hasArchived
              ? `Tu patrimonio total es ${symbol}${money(totalPatrimonyCents)}: incluye ${symbol}${money(archivedCents)} en cuentas archivadas, que no entran en esta lectura operativa.`
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
        { label: "Ingresos", value: money(data.incomeCents), valuePrefix: symbol },
        { label: "Gastos", value: money(data.expenseCents), valuePrefix: symbol },
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
        type: accountTypeLabel(account.type),
        // La tarjeta de una cuenta se lee en la moneda de esa cuenta. El total de
        // arriba sí está convertido, porque un total tiene que ser comparable;
        // una cuenta en dólares mostrada en pesos, en cambio, se lee como si
        // fuera una cuenta en pesos, que es exactamente lo que no es.
        balance: money(account.originalCents),
        balancePrefix: accountPrefix(account.originalCents, account.currency),
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
              valuePrefix: symbol,
              href: `/proximo/${payment.id}`,
              state: payment.dueOn < data.today ? ("attention" as const) : ("default" as const),
            }))
          : [{ label: "No hay pagos próximos cargados", value: "0", valuePrefix: symbol }],
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
                    valuePrefix: movementPrefix(movement.type, movement.currency),
                    href: `/movimientos/${movement.id}`,
                    state: movement.voided ? ("partial" as const) : ("default" as const),
                  }))
                : [{ label: "Todavía no registraste movimientos", value: "0", valuePrefix: symbol }],
            }),
      },
    ],
    investments,
    information: {
      title: "De dónde sale esta lectura",
      primaryLine: hasAccounts
        ? `${activeCount} ${plural(activeCount, "cuenta activa", "cuentas activas")}${archivedCount > 0 ? ` y ${archivedCount} ${plural(archivedCount, "archivada", "archivadas")} fuera de esta lectura` : ""}; ${projection.includedCount} ${plural(projection.includedCount, "pago próximo considerado", "pagos próximos considerados")}.`
        : "Todavía no hay cuentas registradas.",
      causalLine: [
        "Los saldos se derivan del saldo inicial y del ledger, excluyendo movimientos anulados. Las transferencias entre tus cuentas no alteran el total.",
        hasDebt
          ? `Debés ${symbol}${money(owedCents)} en tarjetas: gastar con una tarjeta no saca plata de tus cuentas, la saca el día que pagás el resumen.`
          : null,
        rateLine ? `Lo que está en otra moneda se convirtió a ${data.display.currency}: ${rateLine}` : null,
        missingLine,
      ]
        .filter(Boolean)
        .join(" "),
      linkLabel: "Ver movimientos",
      linkHref: "/movimientos",
      state: informationComplete ? "complete" : "partial",
    },
  };
}
