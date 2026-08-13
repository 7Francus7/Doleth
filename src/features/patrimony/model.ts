import { CURRENCY_SYMBOLS, isSupportedCurrency } from "../../lib/finance/currency";
import { formatCents } from "../../lib/finance/domain";

export type InvestmentResultTone = "positive" | "negative" | "neutral";
export type InvestmentValueMode = "market" | "manual-price" | "declared";

export interface PatrimonyAccountInput {
  id: string;
  name: string;
  type: "CASH" | "BANK" | "WALLET" | "SAVINGS" | "CREDIT_CARD" | "OTHER";
  currency: string;
  status: "ACTIVE" | "ARCHIVED";
  liability: boolean;
  originalCents: bigint;
  valuedCents: bigint;
}

export interface PatrimonyInvestmentInput {
  id: string;
  name: string;
  kind: string;
  symbol: string | null;
  currency: string;
  investedCents: bigint;
  valueCents: bigint;
  convertedInvestedCents: bigint;
  convertedValueCents: bigint;
  quantity: string | null;
  note: string | null;
  status: "ACTIVE" | "ARCHIVED";
  mode: InvestmentValueMode;
  priceProvider: string | null;
  priceAsOf: string | null;
}

export interface PatrimonyModel {
  displayCurrency: string;
  displaySymbol: string;
  accountsComplete: boolean;
  investmentsComplete: boolean;
  investedBasisComplete: boolean;
  patrimonyCents: bigint;
  formula: { id: string; label: string; cents: bigint; href: string }[];
  accountNativeTotals: { currency: string; cents: bigint }[];
  investmentNativeTotals: { currency: string; cents: bigint }[];
  investmentTotalCents: bigint;
  investmentPerformance: { resultCents: bigint; returnLabel: string; tone: InvestmentResultTone } | null;
  investments: InvestmentRow[];
  archivedInvestments: InvestmentRow[];
  accountValuationNote: string | null;
  investmentValuationNote: string | null;
}

export interface InvestmentRow {
  id: string;
  name: string;
  identity: string;
  kindLabel: string;
  currency: string;
  value: string;
  invested: string;
  result: string;
  resultPrefix: string;
  returnLabel: string | null;
  tone: InvestmentResultTone;
  source: string;
  weightLabel: string | null;
  status: "ACTIVE" | "ARCHIVED";
  quantity: string | null;
  note: string | null;
}

export interface InvestmentDetailModel extends InvestmentRow {
  kind: string;
  symbol: string | null;
  priceAsOf: string | null;
}

const AVAILABLE = new Set(["CASH", "BANK", "WALLET"]);
const KIND_LABELS: Record<string, string> = {
  STOCKS: "Acciones / CEDEARs",
  CRYPTO: "Cripto",
  FUND: "Fondos",
  BOND: "Bonos",
  REAL_ESTATE: "Inmuebles",
  CASH_EQUIVALENT: "Liquidez",
  OTHER: "Otras",
};

const sum = <T,>(rows: readonly T[], pick: (row: T) => bigint) => rows.reduce((total, row) => total + pick(row), 0n);
const absolute = (cents: bigint) => cents < 0n ? -cents : cents;
const tone = (cents: bigint): InvestmentResultTone => cents > 0n ? "positive" : cents < 0n ? "negative" : "neutral";
const symbolFor = (currency: string) => isSupportedCurrency(currency) ? CURRENCY_SYMBOLS[currency] : `${currency} `;

function percent(resultCents: bigint, investedCents: bigint): string | null {
  if (investedCents === 0n) return null;
  const basisPoints = Number((resultCents * 10_000n) / investedCents);
  const value = Math.abs(basisPoints / 100).toLocaleString("es-AR", { maximumFractionDigits: 1 });
  return `${basisPoints > 0 ? "+" : basisPoints < 0 ? "−" : ""}${value}%`;
}

function sourceLabel(investment: PatrimonyInvestmentInput): string {
  const date = investment.priceAsOf
    ? new Date(`${investment.priceAsOf}T00:00:00.000Z`).toLocaleDateString("es-AR", { day: "numeric", month: "short", timeZone: "UTC" }).toUpperCase()
    : null;
  if (investment.mode === "market") return `Precio ${investment.priceProvider || "de mercado"}${date ? ` · ${date}` : ""}`;
  if (investment.mode === "manual-price") return `Precio manual${date ? ` · ${date}` : ""}`;
  if (investment.quantity && investment.symbol) return `Sin cotización de ${investment.symbol.toUpperCase()} · último valor cargado`;
  return "Valor manual";
}

function investmentRow(investment: PatrimonyInvestmentInput, totalConvertedCents: bigint, weightsAvailable: boolean): InvestmentRow {
  const resultCents = investment.valueCents - investment.investedCents;
  const weight = weightsAvailable && totalConvertedCents > 0n
    ? Number((investment.convertedValueCents * 10_000n) / totalConvertedCents) / 100
    : null;
  return {
    id: investment.id,
    name: investment.name,
    identity: investment.symbol?.trim().toUpperCase() || investment.name,
    kindLabel: KIND_LABELS[investment.kind] || "Otras",
    currency: investment.currency,
    value: `${symbolFor(investment.currency)}${formatCents(absolute(investment.valueCents))}`,
    invested: `${symbolFor(investment.currency)}${formatCents(absolute(investment.investedCents))}`,
    result: formatCents(absolute(resultCents)),
    resultPrefix: `${resultCents > 0n ? "+" : resultCents < 0n ? "−" : ""}${symbolFor(investment.currency)}`,
    returnLabel: percent(resultCents, investment.investedCents),
    tone: tone(resultCents),
    source: sourceLabel(investment),
    weightLabel: weight === null ? null : `${weight.toLocaleString("es-AR", { maximumFractionDigits: 1 })}% de inversiones`,
    status: investment.status,
    quantity: investment.quantity,
    note: investment.note,
  };
}

export function buildInvestmentDetailModel(investment: PatrimonyInvestmentInput): InvestmentDetailModel {
  return {
    ...investmentRow(investment, 0n, false),
    kind: investment.kind,
    symbol: investment.symbol,
    priceAsOf: investment.priceAsOf,
  };
}

export function buildPatrimonyModel(input: {
  displayCurrency: string;
  displaySymbol: string;
  accountsComplete: boolean;
  investmentsComplete: boolean;
  investedBasisComplete: boolean;
  accounts: PatrimonyAccountInput[];
  investments: PatrimonyInvestmentInput[];
  accountValuationNote?: string | null;
  investmentValuationNote?: string | null;
}): PatrimonyModel {
  const activeAccounts = input.accounts.filter((account) => account.status === "ACTIVE");
  const available = activeAccounts.filter((account) => !account.liability && AVAILABLE.has(account.type));
  const savings = activeAccounts.filter((account) => !account.liability && account.type === "SAVINGS");
  const other = activeAccounts.filter((account) => !account.liability && account.type === "OTHER");
  const archived = input.accounts.filter((account) => !account.liability && account.status === "ARCHIVED");
  const debt = input.accounts.filter((account) => account.liability);
  const accountNative = new Map<string, bigint>();
  for (const account of input.accounts) accountNative.set(account.currency, (accountNative.get(account.currency) ?? 0n) + account.originalCents);

  const activeInvestments = input.investments.filter((investment) => investment.status === "ACTIVE");
  const archivedInvestments = input.investments.filter((investment) => investment.status === "ARCHIVED");
  const investmentNative = new Map<string, bigint>();
  for (const investment of activeInvestments) investmentNative.set(investment.currency, (investmentNative.get(investment.currency) ?? 0n) + investment.valueCents);

  const investmentTotalCents = sum(activeInvestments, (investment) => investment.convertedValueCents);
  const investedTotalCents = sum(activeInvestments, (investment) => investment.convertedInvestedCents);
  const investmentResultCents = investmentTotalCents - investedTotalCents;
  const aggregatePerformance = input.investmentsComplete && input.investedBasisComplete && activeInvestments.length > 0
    ? { resultCents: investmentResultCents, returnLabel: percent(investmentResultCents, investedTotalCents) || "Sin porcentaje", tone: tone(investmentResultCents) }
    : null;

  return {
    displayCurrency: input.displayCurrency,
    displaySymbol: input.displaySymbol,
    accountsComplete: input.accountsComplete,
    investmentsComplete: input.investmentsComplete,
    investedBasisComplete: input.investedBasisComplete,
    patrimonyCents: sum(input.accounts, (account) => account.valuedCents),
    formula: [
      { id: "available", label: "Disponible", cents: sum(available, (account) => account.valuedCents), href: "/cuentas" },
      { id: "savings", label: "Ahorro", cents: sum(savings, (account) => account.valuedCents), href: "/cuentas" },
      { id: "other", label: "Otros", cents: sum(other, (account) => account.valuedCents), href: "/cuentas" },
      { id: "archived", label: "Fuera de uso", cents: sum(archived, (account) => account.valuedCents), href: "/cuentas#archivadas" },
      { id: "debt", label: "Deuda", cents: sum(debt, (account) => account.valuedCents), href: "/cuentas" },
    ].filter((part) => part.cents !== 0n || part.id === "available" || part.id === "savings" || part.id === "debt"),
    accountNativeTotals: [...accountNative].sort(([a], [b]) => a.localeCompare(b)).map(([currency, cents]) => ({ currency, cents })),
    investmentNativeTotals: [...investmentNative].sort(([a], [b]) => a.localeCompare(b)).map(([currency, cents]) => ({ currency, cents })),
    investmentTotalCents,
    investmentPerformance: aggregatePerformance,
    investments: activeInvestments.map((investment) => investmentRow(investment, investmentTotalCents, input.investmentsComplete)),
    archivedInvestments: archivedInvestments.map((investment) => investmentRow(investment, 0n, false)),
    accountValuationNote: input.accountValuationNote || null,
    investmentValuationNote: input.investmentValuationNote || null,
  };
}
