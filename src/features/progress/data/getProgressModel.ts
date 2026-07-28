import "server-only";
import type { EvidenceBreakdown } from "../../evidence/model";
import { formatCents } from "../../../lib/finance/domain";
import { describePlainDateAR } from "../../../lib/finance/movementDate";
import {
  compareProgressPeriods,
  type Milestone,
  type Period,
  type ProgressComparison,
} from "../../../lib/finance/comparison";
import { getProgressData } from "../../../lib/finance/data";
import type { ProgressIndicator, ProgressMilestone, ProgressViewModel } from "../model";

const money = (cents: bigint): string => formatCents(cents < 0n ? -cents : cents);
const prefix = (cents: bigint): string => (cents < 0n ? "-$" : "$");
const plural = (count: number, one: string, many: string): string => (count === 1 ? one : many);

const describePeriod = (period: Period, today: string): string =>
  `del ${describePlainDateAR(period.start, today)} al ${describePlainDateAR(period.end, today)}`;

/**
 * Indicadores factuales. Cada uno dice su fórmula y su denominador, y solo
 * declara dirección cuando el dominio la sostiene: gastar más no es retroceso
 * si el gasto estaba previsto, así que el resultado del período no lleva flecha.
 */
function buildIndicators(progress: ProgressComparison, today: string): ProgressIndicator[] {
  const currentLabel = describePeriod(progress.current, today);
  const previousLabel = describePeriod(progress.previous, today);

  const indicators: ProgressIndicator[] = [
    {
      id: "net",
      label: "Resultado del período",
      reading: `${prefix(progress.netCents)}${money(progress.netCents)} entre ingresos y gastos ${currentLabel}.`,
      formula: "Ingresos − gastos no anulados del período, sin transferencias.",
      reference: progress.hasPreviousPeriod
        ? `${prefix(progress.previousNetCents)}${money(progress.previousNetCents)} en el mismo tramo ${previousLabel}.`
        : "Todavía no hay un tramo anterior con movimientos para comparar.",
      direction: null,
      state: progress.netCents < 0n ? "attention" : "neutral",
    },
    {
      id: "consistency",
      label: "Consistencia de registro",
      reading: `Registraste actividad en ${progress.activeDays} de ${progress.current.days} ${plural(progress.current.days, "día", "días")}.`,
      formula: "Días con al menos un movimiento no anulado sobre días transcurridos del período.",
      reference: progress.hasPreviousPeriod
        ? `${progress.previousActiveDays} de ${progress.previous.days} ${plural(progress.previous.days, "día", "días")} en el tramo anterior.`
        : "Sin tramo anterior comparable.",
      direction: "up-is-better",
      state: progress.activeDays === 0 ? "attention" : progress.consistency >= 50 ? "stable" : "neutral",
      meter: {
        title: "Consistencia de registro",
        value: progress.consistency,
        leftSummary: `${progress.activeDays} de ${progress.current.days} días`,
        rightSummary: `${progress.consistency}%`,
        state: progress.activeDays === 0 ? "empty" : progress.consistency >= 50 ? "stable" : "partial",
        accessibleLabel: `Registraste movimientos en ${progress.activeDays} de los ${progress.current.days} días transcurridos del período.`,
      },
    },
  ];

  if (progress.hasCommitments) {
    indicators.push({
      id: "coverage",
      label: "Cobertura de próximos pagos",
      reading: `Tenés cubierto el ${progress.coveragePercent}% de los $${money(progress.committedCents)} comprometidos.`,
      formula: "Dinero en cuentas activas sobre pagos pendientes del horizonte de 30 días.",
      reference:
        progress.missingCents > 0n
          ? `Faltan $${money(progress.missingCents)} para cubrirlos con lo que tenés hoy.`
          : "Los pagos cargados están cubiertos con el dinero de tus cuentas.",
      direction: "up-is-better",
      state: progress.missingCents > 0n ? "attention" : "stable",
      meter: {
        title: "Cobertura de próximos pagos",
        value: progress.coveragePercent,
        leftSummary: progress.missingCents > 0n ? `Faltan $${money(progress.missingCents)}` : "Cubierto",
        rightSummary: `$${money(progress.committedCents)}`,
        state: progress.missingCents > 0n ? "atRisk" : "stable",
        accessibleLabel: `Cobertura: $${money(progress.baseCents)} de tus cuentas contra $${money(progress.committedCents)} comprometidos.`,
      },
    });
  }

  if (progress.overdueCount > 0) {
    indicators.push({
      id: "overdue",
      label: "Pagos vencidos",
      reading: `${progress.overdueCount} ${plural(
        progress.overdueCount,
        "pago vencido sigue pendiente",
        "pagos vencidos siguen pendientes",
      )} de confirmar.`,
      formula: "Pagos pendientes con vencimiento anterior a hoy.",
      reference: "Se cuentan sobre el estado actual, no contra el período anterior.",
      direction: "down-is-better",
      state: "attention",
    });
  }

  return indicators;
}

const MILESTONE_COPY: Record<Milestone["id"], { label: string; achieved: string; pending: string }> = {
  "first-comparable-period": {
    label: "Primer período comparable",
    achieved: "Ya tenés dos tramos equivalentes con movimientos: se puede comparar.",
    pending: "Cuando el tramo anterior tenga movimientos vas a poder comparar períodos.",
  },
  "positive-patrimony": {
    label: "Patrimonio positivo",
    achieved: "La suma de tus cuentas está por encima de cero.",
    pending: "La suma de tus cuentas todavía no supera cero.",
  },
  "full-coverage": {
    label: "Cobertura completa",
    achieved: "El dinero de tus cuentas alcanza para todos los pagos cargados.",
    pending: "Todavía no alcanza para cubrir todos los pagos cargados.",
  },
  "no-overdue": {
    label: "Sin pagos vencidos",
    achieved: "No queda ningún pago cargado con la fecha pasada.",
    pending: "Queda al menos un pago vencido sin confirmar.",
  },
  "consistent-registration": {
    label: "Registro sostenido",
    achieved: "Registraste movimientos en más de la mitad de los días del período.",
    pending: "Todavía registrás movimientos en menos de la mitad de los días.",
  },
};

function toMilestone(milestone: Milestone): ProgressMilestone {
  const copy = MILESTONE_COPY[milestone.id];
  return {
    id: milestone.id,
    label: copy.label,
    detail: milestone.achieved ? copy.achieved : copy.pending,
    achieved: milestone.achieved,
  };
}

function actionsFor(progress: ProgressComparison, hasAccounts: boolean): ProgressViewModel["actions"] {
  const secondary = [
    { id: "changes", label: "Ver qué cambió" },
    { id: "history", label: "Ver movimientos" },
  ] as const;

  if (!hasAccounts) {
    return { primary: "add-first-account", primaryLabel: "Crear una cuenta", secondaryActions: secondary, state: "default" };
  }
  if (progress.overdueCount > 0 || progress.missingCents > 0n) {
    return { primary: "resolve", primaryLabel: "Revisar próximos pagos", secondaryActions: secondary, state: "default" };
  }
  if (!progress.hasPreviousPeriod || progress.activeDays === 0) {
    return { primary: "register", primaryLabel: "Completar información", secondaryActions: secondary, state: "default" };
  }
  return { primary: "update", primaryLabel: "Ver cómo se calculó", secondaryActions: secondary, state: "default" };
}

export async function getProgressModel(userId: string): Promise<ProgressViewModel> {
  const data = await getProgressData(userId);
  const progress = compareProgressPeriods({
    movements: data.movements,
    current: data.current,
    previous: data.previous,
    equivalent: data.equivalent,
    hasAccounts: data.hasAccounts,
    patrimonyCents: data.patrimonyCents,
    baseCents: data.baseCents,
    committedCents: data.committedCents,
    overdueCount: data.overdueCount,
  });

  const today = data.today;
  const currentLabel = describePeriod(progress.current, today);
  const previousLabel = describePeriod(progress.previous, today);
  const complete = data.hasAccounts && progress.hasPreviousPeriod && data.equivalent && data.commitmentsAvailable;
  const metadata = [
    `Días 1 a ${progress.current.days}`,
    "ARS",
    "Personal",
    progress.hasPreviousPeriod ? "Tramos equivalentes" : "Primer período",
  ] as const;

  const summaryKind =
    progress.state === "improved" ? "stable" : progress.state === "declined" ? "attention" : "neutral";

  // Interpretación factual: qué pasó y contra qué, sin adjetivos de desempeño.
  const stateText: Record<ProgressComparison["state"], string> = {
    "no-base": "Empecemos por tu base real.",
    "first-period": "Este es tu primer tramo con movimientos: todavía no hay contra qué compararlo.",
    improved: `El resultado de este tramo es $${money(progress.deltaCents)} mayor que el del mismo tramo del mes anterior.`,
    declined: `El resultado de este tramo es $${money(progress.deltaCents)} menor que el del mismo tramo del mes anterior.`,
    flat: "El resultado de este tramo es igual al del mismo tramo del mes anterior.",
  };

  const evidence: EvidenceBreakdown | null =
    data.hasAccounts && (progress.incomeCents > 0n || progress.expenseCents > 0n)
      ? {
          status: "complete",
          title: "Cómo se calculó este resultado",
          subtitle: `Ingresos y gastos no anulados ${currentLabel}`,
          summary: `Se comparan tramos equivalentes: ${currentLabel} contra ${previousLabel}. Las transferencias entre tus cuentas no participan porque no cambian tu patrimonio.`,
          lines: [
            {
              id: "income",
              label: "Ingresos del tramo",
              amount: Number(progress.incomeCents),
              displayValue: money(progress.incomeCents),
              valuePrefix: "$",
              sign: "+",
              status: "confirmed",
            },
            {
              id: "expense",
              label: "Gastos del tramo",
              amount: Number(-progress.expenseCents),
              displayValue: money(progress.expenseCents),
              valuePrefix: "$",
              sign: "-",
              status: "confirmed",
            },
          ],
          total: {
            label: "Resultado del tramo",
            amount: Number(progress.netCents),
            displayValue: money(progress.netCents),
            valuePrefix: prefix(progress.netCents),
          },
          metadata,
        }
      : null;

  const indicators = buildIndicators(progress, today);

  return {
    rail: { items: metadata, state: complete ? "complete" : "partial", wrap: "truncate" },
    banner: null,
    hero: data.hasAccounts
      ? {
          scenario: progress.state === "declined" ? "attention" : "stable",
          stateText: stateText[progress.state],
          value: money(progress.netCents),
          valuePrefix: prefix(progress.netCents),
          valueLabel: `Resultado ${currentLabel}`,
          inlineNote: `Se compara contra el mismo tramo del mes anterior: ${previousLabel}.`,
          coverage: indicators.find((indicator) => indicator.meter)?.meter ?? {
            title: "Consistencia de registro",
            value: progress.consistency,
            leftSummary: `${progress.activeDays} de ${progress.current.days} días`,
            rightSummary: `${progress.consistency}%`,
            state: "empty",
            accessibleLabel: `Registraste movimientos en ${progress.activeDays} de ${progress.current.days} días.`,
          },
        }
      : {
          scenario: "new",
          stateText: stateText["no-base"],
          valueLabel: "Creá tu primera cuenta para empezar a medir progreso.",
        },
    evidence,
    comparison: {
      title: "Tramos equivalentes",
      supportingLine: `${currentLabel} contra ${previousLabel}`,
      rows: [
        {
          label: "Resultado del tramo anterior",
          supportingLabel: progress.hasPreviousPeriod
            ? `${progress.previous.days} ${plural(progress.previous.days, "día", "días")} · ${progress.previousActiveDays} con registro`
            : "Sin movimientos registrados",
          value: money(progress.previousNetCents),
          valuePrefix: prefix(progress.previousNetCents),
        },
        {
          kind: "with-status",
          label: "Resultado de este tramo",
          supportingLabel: `${progress.current.days} ${plural(progress.current.days, "día", "días")} · ${progress.activeDays} con registro`,
          status: progress.hasPreviousPeriod
            ? progress.state === "improved"
              ? "Mayor que el anterior"
              : progress.state === "declined"
                ? "Menor que el anterior"
                : "Igual que el anterior"
            : "Sin referencia todavía",
          value: money(progress.netCents),
          valuePrefix: prefix(progress.netCents),
          state: progress.netCents < 0n ? "attention" : "default",
        },
        {
          label: "Diferencia entre tramos",
          supportingLabel: progress.equivalent
            ? "Misma cantidad de días en los dos tramos"
            : `El mes anterior es más corto: se comparan ${progress.previous.days} días contra ${progress.current.days}`,
          value: money(progress.deltaCents),
          valuePrefix: prefix(progress.deltaCents),
        },
      ],
      summary: !data.hasAccounts
        ? "Sin cuentas registradas no hay resultado ni progreso para medir."
        : !progress.hasPreviousPeriod
          ? `No hay movimientos ${previousLabel}: sin ese tramo no se puede afirmar mejora ni retroceso.`
          : !progress.equivalent
            ? `El mes anterior terminó antes: se comparan sus ${progress.previous.days} días contra los ${progress.current.days} transcurridos de este mes.`
            : `Los dos tramos cubren la misma cantidad de días, así que la diferencia de ${prefix(progress.deltaCents)}${money(progress.deltaCents)} no viene de comparar períodos desiguales.`,
      summaryKind,
    },
    indicators: data.hasAccounts
      ? {
          title: "Indicadores del período",
          supportingLine: "Cada uno con su fórmula y su denominador a la vista",
          items: indicators,
        }
      : null,
    milestones: data.hasAccounts
      ? {
          title: "Hitos verificables",
          supportingLine: "Se derivan del estado actual: no se guardan ni se celebran dos veces",
          items: progress.milestones.map(toMilestone),
        }
      : null,
    notice: data.commitmentsAvailable
      ? null
      : "Pudimos calcular el resultado del período, pero no cargar los próximos pagos: la cobertura queda fuera de esta lectura.",
    stability: {
      children: !data.hasAccounts
        ? "Creá tu primera cuenta para empezar a medir tu progreso."
        : !progress.hasPreviousPeriod
          ? "Con un solo tramo no hay contra qué comparar: el progreso se lee con historia."
          : "Cada indicador tiene una fórmula explícita sobre datos reales y declara el período analizado.",
      container: "none",
      kind: summaryKind,
    },
    actions: actionsFor(progress, data.hasAccounts),
    missing: data.hasAccounts
      ? progress.hasPreviousPeriod
        ? null
        : {
            title: "Todavía sin historia comparable",
            primaryLine: `Necesitás movimientos ${previousLabel} para leer mejora o retroceso.`,
            causalLine: "Seguí registrando: la comparación aparece cuando los dos tramos tienen movimientos.",
            linkLabel: "Registrar movimiento",
            linkHref: "/movimientos/nuevo",
            state: "partial",
          }
      : {
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
      state: complete ? "complete" : "partial",
    },
  };
}
