import "server-only";
import type { CoverageMeterProps } from "../../../design-system/composites/CoverageMeter";
import type { EvidenceBreakdown } from "../../evidence/model";
import { formatCents } from "../../../lib/finance/domain";
import { computeProgress } from "../../../lib/finance/analysis";
import { getProgressData } from "../../../lib/finance/data";
import type { ProgressViewModel } from "../model";

const money = (cents: bigint): string => formatCents(cents < 0n ? -cents : cents);
const prefix = (cents: bigint): string => (cents < 0n ? "-$" : "$");

const monthLabel = (month: string): string => {
  const names = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  const index = Number(month.slice(5, 7)) - 1;
  return names[index] ?? month;
};

export async function getProgressModel(): Promise<ProgressViewModel> {
  const data = await getProgressData();
  const progress = computeProgress({
    currentMonthMovements: data.currentMonthMovements,
    previousMonthMovements: data.previousMonthMovements,
    hasPreviousPeriod: data.hasPreviousPeriod,
    availableCents: data.availableCents,
    upcomingCents: data.upcomingCents,
    daysWithActivity: data.daysWithActivity,
    elapsedDays: data.elapsedDays,
  });

  const hasAccounts = data.hasAccounts;
  const hasHistory = data.currentMonthMovements.length > 0 || data.previousMonthMovements.length > 0;
  const completeLabel = !hasAccounts
    ? "Base incompleta"
    : progress.hasPreviousPeriod
      ? "Período comparable"
      : "Primer período";
  const metadata = ["Este mes", "ARS", "Personal", completeLabel] as const;
  const summaryKind =
    progress.direction === "improved" ? "stable" : progress.direction === "declined" ? "attention" : "neutral";

  const currentIncomeCents = data.currentMonthMovements
    .filter((movement) => movement.type === "INCOME")
    .reduce((sum, movement) => sum + movement.amountCents, 0n);
  const currentExpenseCents = data.currentMonthMovements
    .filter((movement) => movement.type === "EXPENSE")
    .reduce((sum, movement) => sum + movement.amountCents, 0n);

  const consistencyMeter: CoverageMeterProps = {
    title: "Consistencia de registro",
    value: progress.consistency,
    leftSummary: `${progress.daysWithActivity} de ${progress.elapsedDays} días`,
    rightSummary: "Este mes",
    state: progress.daysWithActivity === 0 ? "empty" : progress.consistency >= 50 ? "stable" : "partial",
  };
  const coverageMeter: CoverageMeterProps = {
    title: "Cobertura de próximos pagos",
    value: progress.coverage,
    leftSummary: progress.hasUpcoming ? `${progress.coverage}% cubierto` : "Sin pagos pendientes",
    rightSummary: progress.hasUpcoming ? `${prefix(progress.upcomingCents)}${money(progress.upcomingCents)}` : "Nada comprometido",
    state: !progress.hasUpcoming ? "empty" : progress.coverage >= 100 ? "stable" : "atRisk",
  };
  const meters = progress.hasUpcoming ? [coverageMeter, consistencyMeter] : [consistencyMeter];

  const evidence: EvidenceBreakdown | null =
    hasAccounts && data.currentMonthMovements.length > 0
      ? {
          status: "complete",
          title: `Resultado de ${monthLabel(data.currentMonth)}`,
          subtitle: "Ingresos y gastos no anulados del mes",
          lines: [
            {
              id: "income",
              label: "Ingresos del mes",
              amount: Number(currentIncomeCents),
              displayValue: money(currentIncomeCents),
              valuePrefix: "$",
              sign: "+",
              status: "confirmed",
            },
            {
              id: "expense",
              label: "Gastos del mes",
              amount: Number(-currentExpenseCents),
              displayValue: money(currentExpenseCents),
              valuePrefix: "$",
              sign: "-",
              status: "confirmed",
            },
          ],
          total: {
            label: "Resultado neto",
            amount: Number(progress.currentNetCents),
            displayValue: money(progress.currentNetCents),
            valuePrefix: prefix(progress.currentNetCents),
          },
          metadata,
        }
      : null;

  const hero: ProgressViewModel["hero"] = hasAccounts
    ? {
        scenario: progress.currentNetCents < 0n ? "attention" : "stable",
        stateText: !hasHistory
          ? "Todavía no hay historia suficiente para leer progreso."
          : progress.currentNetCents < 0n
            ? "Este mes gastaste más de lo que ingresó."
            : "Este mes vas con resultado positivo.",
        value: money(progress.currentNetCents),
        valuePrefix: prefix(progress.currentNetCents),
        valueLabel: `Resultado de ${monthLabel(data.currentMonth)}`,
        inlineNote: "Solo cuenta ingresos y gastos reales; las transferencias no afectan el resultado.",
        coverage: progress.hasUpcoming ? coverageMeter : consistencyMeter,
      }
    : {
        scenario: "new",
        stateText: "Empecemos por tu base real.",
        valueLabel: "Creá tu primera cuenta para empezar a medir progreso.",
      };

  return {
    rail: { items: metadata, state: progress.hasPreviousPeriod ? "complete" : "partial", wrap: "truncate" },
    banner: null,
    hero,
    evidence,
    comparison: {
      title: "Comparación entre períodos",
      supportingLine: progress.hasPreviousPeriod
        ? `${monthLabel(data.previousMonth)} contra ${monthLabel(data.currentMonth)}`
        : "Todavía no hay un período anterior comparable",
      rows: [
        {
          label: `Neto de ${monthLabel(data.previousMonth)}`,
          supportingLabel: progress.hasPreviousPeriod ? "Mes anterior" : "Sin actividad comparable",
          value: money(progress.previousNetCents),
          valuePrefix: prefix(progress.previousNetCents),
        },
        {
          kind: "with-status",
          label: `Neto de ${monthLabel(data.currentMonth)}`,
          supportingLabel: "Mes actual",
          status:
            progress.direction === "improved"
              ? "Mejora verificable"
              : progress.direction === "declined"
                ? "Retroceso verificable"
                : "Sin comparación disponible",
          value: money(progress.currentNetCents),
          valuePrefix: prefix(progress.currentNetCents),
        },
      ],
      summary: !progress.hasPreviousPeriod
        ? "Sin un mes anterior con actividad no se puede afirmar mejora ni retroceso. Este es tu primer período registrado."
        : progress.direction === "improved"
          ? `Mejoraste ${money(progress.deltaCents)} respecto del mes anterior.`
          : progress.direction === "declined"
            ? `Retrocediste ${money(progress.deltaCents)} respecto del mes anterior.`
            : "El resultado es igual al del mes anterior.",
      summaryKind,
    },
    stability: {
      children: !hasAccounts
        ? "Creá tu primera cuenta para empezar a medir tu progreso."
        : !hasHistory
          ? "Con un solo período no hay contra qué comparar todavía: el progreso se lee con historia."
          : "Cada indicador tiene una fórmula explícita sobre datos reales y declara el período analizado.",
      container: "none",
      kind: summaryKind,
    },
    actions: null,
    goals: hasAccounts
      ? {
          title: "Indicadores del período",
          supportingLine: "Derivados de datos reales, con su denominador visible",
          meters,
        }
      : null,
    missing: hasAccounts
      ? progress.hasPreviousPeriod
        ? null
        : {
            title: "Todavía sin historia comparable",
            primaryLine: "Necesitás al menos un mes anterior con movimientos para leer mejora o retroceso.",
            causalLine: "Seguí registrando: el progreso aparece cuando hay dos períodos comparables.",
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
      title: "Fuente de estos indicadores",
      primaryLine: "No usa metas inventadas ni presupuestos inexistentes.",
      causalLine:
        "Cada indicador se deriva del ledger real: resultado del mes, cobertura de próximos pagos y días con registro, excluyendo movimientos anulados y transferencias.",
      linkLabel: "Abrir historial",
      linkHref: "/movimientos",
      state: progress.hasPreviousPeriod ? "complete" : "partial",
    },
  };
}
