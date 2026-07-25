import "server-only";
import type { EvidenceBreakdown } from "../../evidence/model";
import { formatCents } from "../../../lib/finance/domain";
import { describeDateAR, describePlainDateAR } from "../../../lib/finance/movementDate";
import {
  MATERIAL_SHARE_PERCENT,
  compareChangePeriods,
  type CauseGroup,
  type ChangeComparison,
  type Period,
} from "../../../lib/finance/comparison";
import { getChangesData } from "../../../lib/finance/data";
import type { ChangeCauseRow, ChangesViewModel } from "../model";

const money = (cents: bigint): string => formatCents(cents < 0n ? -cents : cents);
const prefix = (cents: bigint): string => (cents < 0n ? "-$" : "$");
const plural = (count: number, one: string, many: string): string => (count === 1 ? one : many);

/** "del 18 al 24 de julio": el período se dice en fechas argentinas, no en jerga. */
const describePeriod = (period: Period, today: string): string =>
  `del ${describePlainDateAR(period.start, today)} al ${describePlainDateAR(period.end, today)}`;

/** El estado viaja como texto: el color nunca es el único indicador. */
const STATE_LABELS: Record<ChangeComparison["state"], string> = {
  "no-base": "Sin base",
  "no-previous": "Primer período",
  partial: "Parcial",
  stable: "Estable",
  up: "Sube",
  down: "Baja",
};

const percentLabel = (percent: number): string =>
  `${percent > 0 ? "+" : percent < 0 ? "-" : ""}${Math.abs(percent).toLocaleString("es-AR", {
    maximumFractionDigits: 1,
  })}%`;

/**
 * Enlace al historial filtrado por la categoría de la causa. El historial filtra
 * por mes: si el período cruza dos meses, el filtro mostraría menos de lo que la
 * causa suma, así que en ese caso no se ofrece enlace en vez de mentir.
 */
function causeHref(cause: CauseGroup, period: Period): string | undefined {
  if (cause.aggregated) return undefined;
  if (!cause.id.startsWith("category:")) return undefined;
  if (period.start.slice(0, 7) !== period.end.slice(0, 7)) return undefined;
  const categoryId = cause.id.slice("category:".length);
  const query = new URLSearchParams({
    month: period.end.slice(0, 7),
    categoryId,
    volver: "/cambios",
  });
  return `/movimientos?${query.toString()}`;
}

function toCauseRow(cause: CauseGroup, period: Period): ChangeCauseRow {
  return {
    id: cause.id,
    label: cause.label,
    supportingLabel: `${cause.share}% del movimiento bruto · ${cause.movementCount} ${plural(
      cause.movementCount,
      "movimiento",
      "movimientos",
    )}`,
    value: money(cause.effectCents),
    valuePrefix: cause.direction === "in" ? "+$" : "-$",
    direction: cause.direction,
    material: cause.material,
    ...(causeHref(cause, period) ? { href: causeHref(cause, period)! } : {}),
  };
}

function buildEvidence(
  change: ChangeComparison,
  today: string,
  metadata: ChangesViewModel["rail"]["items"],
): EvidenceBreakdown {
  return {
    status: "complete",
    title: "Cómo se calculó este cambio",
    subtitle: `Movimientos no anulados ${describePeriod(change.period, today)}`,
    summary: [
      `Patrimonio al inicio: ${prefix(change.openingCents)}${money(change.openingCents)}.`,
      `Entraron $${money(change.incomeCents)} y salieron $${money(change.expenseCents)}.`,
      change.transferCount > 0
        ? `${change.transferCount} ${plural(change.transferCount, "transferencia", "transferencias")} entre cuentas propias quedan fuera: no cambian el patrimonio.`
        : "No hubo transferencias entre cuentas propias en el período.",
      "Los movimientos anulados y el original de una corrección no participan.",
    ].join(" "),
    lines: change.causes.map((cause) => ({
      id: cause.id,
      label: cause.label,
      amount: Number(cause.effectCents),
      displayValue: money(cause.effectCents),
      valuePrefix: "$",
      sign: cause.direction === "in" ? "+" : "-",
      status: "confirmed",
    })),
    total: {
      label: "Cambio neto del período",
      amount: Number(change.netCents),
      displayValue: money(change.netCents),
      valuePrefix: prefix(change.netCents),
    },
    metadata,
  };
}

/** Una sola acción principal, derivada del estado real de la pantalla. */
function actionsFor(change: ChangeComparison): ChangesViewModel["actions"] {
  const secondary = [
    { id: "upcoming", label: "Ver próximos pagos" },
    { id: "history", label: "Ver movimientos" },
  ] as const;

  if (change.state === "no-base") {
    return {
      primary: "add-first-account",
      primaryLabel: "Crear una cuenta",
      secondaryActions: secondary,
      state: "default",
    };
  }
  if (change.movementCount === 0) {
    return {
      primary: "register",
      primaryLabel: "Registrar un movimiento",
      secondaryActions: secondary,
      state: "default",
    };
  }
  return {
    primary: "resolve",
    primaryLabel: "Ver los movimientos que explican el cambio",
    secondaryActions: secondary,
    state: "default",
  };
}

export async function getChangesModel(): Promise<ChangesViewModel> {
  const data = await getChangesData();
  const change = compareChangePeriods({
    movements: data.movements,
    period: data.period,
    previous: data.previous,
    patrimonyCents: data.patrimonyCents,
    hasAccounts: data.hasAccounts,
    firstMovementDay: data.firstMovementDay,
  });

  const today = data.today;
  const periodLabel = describePeriod(change.period, today);
  const previousLabel = describePeriod(change.previous, today);
  // Una comparación es completa solo si cubre el período anterior entero.
  const complete =
    data.hasAccounts && data.causesAvailable && !change.partial && change.hasPreviousPeriod;
  const metadata = [
    `Últimos ${change.period.days} días`,
    "ARS",
    "Personal",
    complete ? "Comparación completa" : "Comparación parcial",
  ] as const;

  const summaryKind =
    change.state === "down" ? "attention" : change.state === "up" ? "stable" : "neutral";

  // La conclusión primero: qué cambió y cuánto, en una sola frase.
  const headline: Record<typeof change.state, string> = {
    "no-base": "Todavía no hay una base para leer cambios.",
    "no-previous": "Este es tu primer período comparable.",
    partial: "Esta comparación usa información parcial.",
    stable: "Tu situación se mantuvo prácticamente igual.",
    up: `${periodLabel.charAt(0).toUpperCase()}${periodLabel.slice(1)} tenés $${money(change.netCents)} más.`,
    down: `${periodLabel.charAt(0).toUpperCase()}${periodLabel.slice(1)} tenés $${money(change.netCents)} menos.`,
  };

  const causeRows = change.causes.map((cause) => toCauseRow(cause, change.period));
  const causesNote = change.hiddenCauseCount > 0
    ? `Las ${change.hiddenCauseCount} ${plural(change.hiddenCauseCount, "causa menor", "causas menores")} restantes están agrupadas en "Otros": la suma de las causas sigue dando el cambio neto.`
    : "La suma de las causas da exactamente el cambio neto del período.";

  return {
    rail: {
      items: metadata,
      state: complete ? "complete" : "partial",
      wrap: "truncate",
    },
    banner: null,
    hero: data.hasAccounts
      ? {
          scenario: change.state === "down" ? "attention" : "stable",
          stateText: headline[change.state],
          value: money(change.netCents),
          valuePrefix: prefix(change.netCents),
          valueLabel: `Cambio de patrimonio ${periodLabel}`,
          inlineNote:
            change.percent !== null
              ? `${percentLabel(change.percent)} sobre los ${prefix(change.openingCents)}${money(change.openingCents)} con los que empezó el período.`
              : "Sin patrimonio inicial positivo no se puede expresar el cambio en porcentaje.",
          coverage: {
            title: "Cambio explicado por causas",
            value: change.movementCount > 0 ? 100 : 0,
            leftSummary:
              change.movementCount > 0
                ? `${change.causes.length} ${plural(change.causes.length, "causa", "causas")}`
                : "Sin movimientos en el período",
            rightSummary:
              change.movementCount > 0
                ? `${prefix(change.netCents)}${money(change.netCents)} netos`
                : "Nada por explicar",
            state: change.movementCount > 0 ? "stable" : "empty",
            accessibleLabel:
              change.movementCount > 0
                ? `Las causas suman ${prefix(change.netCents)}${money(change.netCents)}, exactamente el cambio neto.`
                : "No hubo movimientos que expliquen un cambio en el período.",
          },
        }
      : {
          scenario: "new",
          stateText: headline["no-base"],
          valueLabel: "Creá una cuenta con su saldo real para empezar a leer cambios.",
        },
    evidence: data.causesAvailable && data.hasAccounts ? buildEvidence(change, today, metadata) : null,
    comparison: {
      title: "Período comparado",
      supportingLine: `${periodLabel} contra ${previousLabel}`,
      rows: [
        {
          label: "Patrimonio al inicio",
          supportingLabel: describeDateAR(change.period.start, today),
          value: money(change.openingCents),
          valuePrefix: prefix(change.openingCents),
        },
        {
          label: "Patrimonio hoy",
          supportingLabel: describeDateAR(change.period.end, today),
          value: money(change.closingCents),
          valuePrefix: prefix(change.closingCents),
        },
        {
          kind: "with-status",
          label: "Diferencia",
          supportingLabel: change.percent !== null ? percentLabel(change.percent) : "Sin porcentaje válido",
          status: STATE_LABELS[change.state],
          value: money(change.netCents),
          valuePrefix: prefix(change.netCents),
          state: change.state === "down" ? "attention" : "default",
        },
        {
          label: `Mismo período anterior (${change.previous.days} días)`,
          supportingLabel: change.hasPreviousPeriod
            ? `${change.previousMovementCount} ${plural(change.previousMovementCount, "movimiento", "movimientos")}`
            : "Sin movimientos registrados",
          value: money(change.previousNetCents),
          valuePrefix: prefix(change.previousNetCents),
        },
      ],
      summary: !data.hasAccounts
        ? "Sin cuentas registradas no hay patrimonio ni período anterior contra el cual comparar."
        : change.state === "no-previous"
          ? `No hay movimientos ${previousLabel}: este es tu primer período comparable, así que todavía no se puede afirmar que subiste o bajaste respecto de antes.`
          : change.state === "partial"
            ? `Tu historial empieza dentro del período anterior, así que la comparación no cubre sus ${change.previous.days} días completos.`
            : change.state === "stable"
              ? `La variación quedó por debajo de $${money(change.thresholdCents)}, el umbral a partir del cual consideramos que un cambio es material.`
              : `El patrimonio pasó de ${prefix(change.openingCents)}${money(change.openingCents)} a ${prefix(change.closingCents)}${money(change.closingCents)} por ${change.movementCount} ${plural(change.movementCount, "movimiento no anulado", "movimientos no anulados")}.`,
      summaryKind,
    },
    causes:
      data.causesAvailable && causeRows.length > 0
        ? {
            title: "Qué explica el cambio",
            supportingLine: `Categorías ordenadas por impacto · material desde ${MATERIAL_SHARE_PERCENT}% del bruto`,
            rows: causeRows,
            note: causesNote,
          }
        : null,
    transfers:
      change.transferCount > 0
        ? {
            line: `También moviste $${money(change.transfersCents)} entre tus cuentas en ${change.transferCount} ${plural(change.transferCount, "transferencia", "transferencias")}. No cambian tu patrimonio, así que no cuentan como causa.`,
          }
        : null,
    notice: data.causesAvailable
      ? null
      : "Pudimos calcular el cambio total, pero no cargar su desglose por causas.",
    stability: {
      children: !data.hasAccounts
        ? "Creá tu primera cuenta con su saldo real para empezar a leer cambios."
        : change.movementCount > 0
          ? "Cada causa sale de movimientos no anulados del período. Las transferencias entre tus cuentas quedan fuera porque no cambian tu patrimonio."
          : "No hubo movimientos que cambien tu patrimonio en el período observado.",
      container: "none",
      kind: summaryKind,
    },
    actions: actionsFor(change),
    missing: data.hasAccounts
      ? null
      : {
          title: "Falta tu base financiera",
          primaryLine: "Sin cuentas registradas no hay patrimonio ni lectura previa para comparar.",
          causalLine: "Creá al menos una cuenta con su saldo inicial para habilitar esta lectura.",
          linkLabel: "Crear cuenta",
          linkHref: "/cuentas/nueva",
          state: "partial",
        },
    information: {
      title: "De dónde sale esta lectura",
      primaryLine: `${change.movementCount} ${plural(change.movementCount, "movimiento considerado", "movimientos considerados")} ${periodLabel}; ${change.previousMovementCount} en el período anterior.`,
      causalLine:
        "El cambio se deriva del ledger real: movimientos no anulados, sin transferencias internas y sin contar dos veces una corrección.",
      linkLabel: "Ver movimientos",
      linkHref: "/movimientos",
      state: complete ? "complete" : "partial",
    },
  };
}
