import "server-only";
import type { EvidenceBreakdown } from "../../evidence/model";
import { formatCents, formatDateAR } from "../../../lib/finance/domain";
import { computeChanges, type ChangeCause } from "../../../lib/finance/analysis";
import { getChangesData } from "../../../lib/finance/data";
import type { ChangesViewModel } from "../model";

const money = (cents: bigint): string => formatCents(cents < 0n ? -cents : cents);
const prefix = (cents: bigint): string => (cents < 0n ? "-$" : "$");

function buildEvidence(
  causes: readonly ChangeCause[],
  netCents: bigint,
  metadata: ChangesViewModel["rail"]["items"],
): EvidenceBreakdown {
  return {
    status: "complete",
    title: "Movimientos que explican el cambio",
    subtitle: "Últimos 7 días · no anulados",
    lines: causes.map((cause) => ({
      id: cause.id,
      label: cause.label,
      amount: Number(cause.effectCents),
      displayValue: money(cause.effectCents),
      valuePrefix: "$",
      sign: cause.direction === "in" ? "+" : "-",
      status: "confirmed",
    })),
    total: {
      label: "Cambio neto",
      amount: Number(netCents),
      displayValue: money(netCents),
      valuePrefix: prefix(netCents),
    },
    metadata,
  };
}

export async function getChangesModel(): Promise<ChangesViewModel> {
  const data = await getChangesData();
  const changes = computeChanges(data.movements, data.currentPatrimonyCents);
  const { netCents, referenceCents, currentCents, direction, causes, hasMovements } = changes;

  const completeLabel = data.hasAccounts ? "Información completa" : "Base incompleta";
  const metadata = ["Últimos 7 días", "ARS", "Personal", completeLabel] as const;
  const summaryKind = direction === "down" ? "attention" : direction === "up" ? "stable" : "neutral";

  const stateText = !data.hasAccounts
    ? "Todavía no hay una base para leer cambios."
    : !hasMovements
      ? "No hay hechos materiales recientes que te muevan de lugar."
      : direction === "down"
        ? "Hoy estás más abajo por salidas ya registradas."
        : direction === "up"
          ? "Hoy estás más arriba por ingresos ya registrados."
          : "Los hechos recientes se compensan entre sí.";

  const summary = !data.hasAccounts
    ? "Sin cuentas todavía no hay una lectura previa contra la cual comparar."
    : !hasMovements
      ? "La lectura previa y la actual coinciden: no aparece una variación material en la ventana observada."
      : `El patrimonio pasó de ${prefix(referenceCents)}${money(referenceCents)} a ${prefix(currentCents)}${money(currentCents)} por movimientos ya aplicados en los últimos 7 días.`;

  return {
    rail: { items: metadata, state: data.hasAccounts ? "complete" : "partial", wrap: "truncate" },
    banner: null,
    hero: {
      scenario: direction === "down" ? "attention" : "stable",
      stateText,
      value: money(netCents),
      valuePrefix: prefix(netCents),
      valueLabel: "Cambio neto de los últimos 7 días",
      inlineNote: hasMovements
        ? "Cada causa proviene de un movimiento no anulado; las transferencias no cuentan como cambio."
        : "La estabilidad reciente también es una lectura válida.",
      coverage: {
        title: "Explicación conocida",
        value: hasMovements ? 100 : 0,
        leftSummary: hasMovements ? "Totalmente explicado" : "Sin cambios materiales",
        rightSummary: hasMovements ? `${prefix(netCents)}${money(netCents)} netos` : "Nada por explicar",
        state: hasMovements ? "stable" : "empty",
      },
    },
    evidence: buildEvidence(causes, netCents, metadata),
    comparison: {
      title: "Comparación breve",
      supportingLine: `Hace 7 días (${formatDateAR(data.windowStart)}) contra hoy`,
      rows: [
        {
          label: "Patrimonio hace 7 días",
          supportingLabel: `Referencia · ${formatDateAR(data.windowStart)}`,
          value: money(referenceCents),
          valuePrefix: prefix(referenceCents),
        },
        {
          kind: "with-status",
          label: "Patrimonio hoy",
          supportingLabel: `Hoy · ${formatDateAR(data.today)}`,
          status:
            direction === "down"
              ? "Cambio ya aplicado a la baja"
              : direction === "up"
                ? "Cambio ya aplicado al alza"
                : "Sin variación material",
          value: money(currentCents),
          valuePrefix: prefix(currentCents),
        },
      ],
      summary,
      summaryKind,
      ...(hasMovements ? { actionLabel: "Ver evidencia", actionHref: "#changes-evidence" } : {}),
    },
    stability: {
      children: !data.hasAccounts
        ? "Creá tu primera cuenta con su saldo real para empezar a leer cambios."
        : hasMovements
          ? "Lo que pasó en los últimos 7 días alcanza para explicar por qué hoy estás distinto."
          : "No aparece un hecho reciente que cambie materialmente la lectura de hoy.",
      container: "none",
      kind: summaryKind,
    },
    actions: null,
    explained: hasMovements
      ? {
          title: "Hechos que explican este cambio",
          rows: causes.slice(0, 5).map((cause) => ({
            kind: "with-status",
            label: cause.label,
            supportingLabel: `${formatDateAR(cause.occurredOn)} · ${cause.accountName}`,
            status: cause.direction === "in" ? "Suma al patrimonio" : "Resta del patrimonio",
            value: money(cause.effectCents),
            valuePrefix: cause.direction === "in" ? "+$" : "-$",
          })),
        }
      : null,
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
      title: "Fuente de esta explicación",
      primaryLine: "No usa saldos editables ni cifras simuladas.",
      causalLine:
        "El cambio se deriva del ledger real: movimientos no anulados de los últimos 7 días, excluyendo transferencias internas.",
      linkLabel: "Abrir historial",
      linkHref: "/movimientos",
      state: data.hasAccounts ? "complete" : "partial",
    },
  };
}
