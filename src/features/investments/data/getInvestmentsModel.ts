import "server-only";
import type { AllocationSegment } from "../../../design-system/composites/AllocationChart";
import { formatCents } from "../../../lib/finance/domain";
import { getPortfolio } from "../../../lib/finance/data";
import { formatQuantity, weightBasisPoints, type ValuedHolding } from "../../../lib/finance/holdings";
import { formatRate } from "../../../lib/finance/currency";
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

/**
 * De dónde sale el valor de una tenencia, dicho en una línea.
 *
 * Un número que se actualiza solo y uno que alguien escribió hace tres meses no
 * merecen la misma confianza. Presentarlos iguales sería mentir por omisión, así
 * que cada fila declara su origen.
 */
function describeSource(holding: ValuedHolding): string {
  if (holding.mode === "declared") {
    return holding.quantityMicros !== null && holding.symbol
      ? `Sin precio de ${holding.symbol.toUpperCase()}: es el último valor que cargaste.`
      : "Valor que cargaste vos.";
  }
  const quantity = holding.quantityMicros === null ? "" : `${formatQuantity(holding.quantityMicros)} × `;
  const price = holding.price ? `$${formatRate(holding.price.priceMicros)}` : "";
  const origin = holding.mode === "market" ? holding.price?.provider ?? "mercado" : "precio tuyo";
  return `${quantity}${price} · ${origin}`;
}

/**
 * Cómo se está valuando la cartera, en una frase.
 *
 * Enumera sólo los grupos que existen: decir "0 tenencias con precio propio"
 * agrega ruido sin informar nada.
 */
function describePortfolioSources(market: number, manualPrice: number, declared: number): string {
  const parts: string[] = [];
  if (market > 0) parts.push(`${market} ${market === 1 ? "se actualiza sola" : "se actualizan solas"} con el precio del mercado`);
  if (manualPrice > 0) parts.push(`${manualPrice} ${manualPrice === 1 ? "usa" : "usan"} el precio que cargaste`);
  if (declared > 0) parts.push(`${declared} ${declared === 1 ? "muestra el valor" : "muestran el valor"} que escribiste`);

  if (parts.length === 0) return "Sin inversiones todavía no hay una cartera que mostrar.";
  if (parts.length === 1 && declared > 0) {
    return "Todos los valores son los que escribiste. Cargá la cantidad y el símbolo de una tenencia para que se calcule con su precio.";
  }
  const list = parts.length === 1 ? parts[0]! : `${parts.slice(0, -1).join(", ")} y ${parts[parts.length - 1]!}`;
  return `De tus tenencias, ${list}.`;
}

export async function getInvestmentsModel(userId: string): Promise<InvestmentsViewModel> {
  const { portfolio } = await getPortfolio(userId);
  const investments = portfolio.holdings;
  const hasInvestments = investments.length > 0;

  const totalValueCents = portfolio.totalValueCents;
  const totalInvestedCents = portfolio.totalInvestedCents;
  const gainCents = portfolio.totalResultCents;

  const byKind = new Map<string, { valueCents: bigint; investedCents: bigint }>();
  for (const item of investments) {
    const bucket = byKind.get(item.kind) ?? { valueCents: 0n, investedCents: 0n };
    bucket.valueCents += item.valueCents;
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
    holdings: investments.map((item) => ({
      id: item.id,
      name: item.name,
      kindLabel: kindLabels[item.kind] ?? "Otras",
      value: formatCents(item.valueCents),
      valuePrefix: "$",
      invested: formatCents(item.investedCents),
      deltaLabel: percentLabel(item.valueCents, item.investedCents),
      deltaState: toneOf(item.resultCents),
      source: describeSource(item),
      // Peso sobre el total valuado: responde "¿qué parte de lo que tengo hoy
      // está acá?", que es la pregunta que importa para saber si estás
      // demasiado concentrado en un solo lugar.
      weightLabel: `${(weightBasisPoints(item.valueCents, totalValueCents) / 100).toLocaleString("es-AR", { maximumFractionDigits: 1 })}% de la cartera`,
    })),
    // Tres estados y no dos: una tenencia con precio propio sí se valúa por
    // cantidad por precio —cambiar ese precio actualiza todo de una— aunque no
    // se actualice sola. Contarla como "cargada a mano" sería negarle a la
    // persona la mitad de lo que ya consiguió.
    stability: !hasInvestments
      ? "Sin inversiones todavía no hay una cartera que mostrar."
      : describePortfolioSources(portfolio.marketCount, portfolio.manualPriceCount, portfolio.declaredCount),
  };
}
