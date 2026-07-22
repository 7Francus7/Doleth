import "server-only";
import type { AllocationSegment } from "../../../design-system/composites/AllocationChart";
import { formatCents } from "../../../lib/finance/domain";
import { getInvestments } from "../../../lib/finance/data";
import type { InvestmentTone, InvestmentsViewModel } from "../model";

const kindLabels: Record<string, string> = {
  STOCKS: "Acciones / CEDEARs",
  CRYPTO: "Cripto",
  FUND: "Fondos (FCI)",
  BOND: "Bonos",
  REAL_ESTATE: "Inmuebles",
  CASH_EQUIVALENT: "Liquidez",
  OTHER: "Otras",
};

// Stable ordering so allocation colours stay consistent between renders.
const kindOrder = ["STOCKS", "CRYPTO", "FUND", "BOND", "REAL_ESTATE", "CASH_EQUIVALENT", "OTHER"];

function toneOf(deltaCents: bigint): InvestmentTone {
  if (deltaCents > 0n) return "positive";
  if (deltaCents < 0n) return "negative";
  return "neutral";
}

function percentLabel(currentCents: bigint, investedCents: bigint): string {
  if (investedCents === 0n) return "—";
  const basisPoints = Number(((currentCents - investedCents) * 10000n) / investedCents);
  const percent = basisPoints / 100;
  const sign = percent > 0 ? "+" : percent < 0 ? "-" : "";
  return `${sign}${Math.abs(percent).toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`;
}

function sharePercent(part: bigint, whole: bigint): number {
  if (whole === 0n) return 0;
  return Number((part * 10000n) / whole) / 100;
}

export async function getInvestmentsModel(): Promise<InvestmentsViewModel> {
  const investments = await getInvestments();
  const hasInvestments = investments.length > 0;

  const totalValueCents = investments.reduce((sum, item) => sum + item.currentValueCents, 0n);
  const totalInvestedCents = investments.reduce((sum, item) => sum + item.investedCents, 0n);
  const gainCents = totalValueCents - totalInvestedCents;

  const byKind = new Map<string, { valueCents: bigint; investedCents: bigint }>();
  for (const item of investments) {
    const bucket = byKind.get(item.kind) ?? { valueCents: 0n, investedCents: 0n };
    bucket.valueCents += item.currentValueCents;
    bucket.investedCents += item.investedCents;
    byKind.set(item.kind, bucket);
  }

  const segments: AllocationSegment[] = kindOrder
    .filter((kind) => byKind.has(kind))
    .map((kind) => {
      const bucket = byKind.get(kind)!;
      const delta = bucket.valueCents - bucket.investedCents;
      return {
        id: kind,
        label: kindLabels[kind] ?? "Otras",
        value: formatCents(bucket.valueCents),
        valuePrefix: "$",
        allocationPercent: sharePercent(bucket.valueCents, totalValueCents),
        deltaLabel: percentLabel(bucket.valueCents, bucket.investedCents),
        deltaState: toneOf(delta),
      };
    });

  return {
    hasInvestments,
    stateText: hasInvestments
      ? gainCents >= 0n
        ? "Tu cartera está por encima de lo aportado."
        : "Tu cartera está por debajo de lo aportado."
      : "Registrá tu primera inversión para ver tu cartera.",
    total: {
      value: formatCents(totalValueCents),
      valuePrefix: "$",
      label: "Valor de cartera",
    },
    performance: hasInvestments
      ? {
          invested: formatCents(totalInvestedCents),
          gain: formatCents(gainCents < 0n ? -gainCents : gainCents),
          gainPrefix: gainCents < 0n ? "-$" : "+$",
          gainPercentLabel: percentLabel(totalValueCents, totalInvestedCents),
          state: toneOf(gainCents),
        }
      : null,
    segments,
    holdings: investments.map((item) => {
      const delta = item.currentValueCents - item.investedCents;
      return {
        id: item.id,
        name: item.name,
        kindLabel: kindLabels[item.kind] ?? "Otras",
        value: formatCents(item.currentValueCents),
        valuePrefix: "$",
        invested: formatCents(item.investedCents),
        deltaLabel: percentLabel(item.currentValueCents, item.investedCents),
        deltaState: toneOf(delta),
      };
    }),
    stability: hasInvestments
      ? "Los valores son los que cargaste manualmente; Doleth no estima cotizaciones."
      : "Sin inversiones todavía no hay una cartera que mostrar.",
  };
}
