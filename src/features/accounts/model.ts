import { formatCents } from "../../lib/finance/domain";
import { accountTypeLabel, type AccountKind } from "../../lib/finance/accountKind";
import { CURRENCY_SYMBOLS, isSupportedCurrency } from "../../lib/finance/currency";

export interface AccountViewInput {
  id: string; name: string; type: AccountKind; currency: string; status: "ACTIVE" | "ARCHIVED";
  liability: boolean; originalCents: bigint; valuedCents: bigint;
}

export interface AccountsViewModel {
  displayCurrency: string;
  displaySymbol: string;
  totalComplete: boolean;
  availableCents: bigint;
  savingsCents: bigint;
  debtCents: bigint;
  accounts: ReturnType<typeof accountRow>[];
  currencyTotals: { currency: string; cents: bigint; formatted: string }[];
}

const AVAILABLE_TYPES = new Set<AccountKind>(["CASH", "BANK", "WALLET"]);

export function accountRow(account: AccountViewInput) {
  const symbol = isSupportedCurrency(account.currency) ? CURRENCY_SYMBOLS[account.currency] : `${account.currency} `;
  const negative = account.originalCents < 0n;
  const absolute = negative ? -account.originalCents : account.originalCents;
  return {
    ...account,
    typeLabel: accountTypeLabel(account.type),
    balance: `${negative ? "−" : ""}${symbol}${formatCents(absolute)}`,
    bucket: account.liability ? "DEBT" as const : account.type === "SAVINGS" ? "SAVINGS" as const : AVAILABLE_TYPES.has(account.type) ? "AVAILABLE" as const : "OTHER" as const,
  };
}

export function buildAccountsViewModel(input: {
  displayCurrency: string; displaySymbol: string; complete: boolean; accounts: AccountViewInput[];
}): AccountsViewModel {
  const active = input.accounts.filter((account) => account.status === "ACTIVE");
  const available = active.filter((account) => AVAILABLE_TYPES.has(account.type) && !account.liability);
  const savings = active.filter((account) => account.type === "SAVINGS" && !account.liability);
  const debt = active.filter((account) => account.liability);
  const currencyMap = new Map<string, bigint>();
  for (const account of active.filter((account) => !account.liability)) {
    currencyMap.set(account.currency, (currencyMap.get(account.currency) ?? 0n) + account.originalCents);
  }
  return {
    displayCurrency: input.displayCurrency,
    displaySymbol: input.displaySymbol,
    totalComplete: input.complete,
    availableCents: available.reduce((sum, account) => sum + account.valuedCents, 0n),
    savingsCents: savings.reduce((sum, account) => sum + account.valuedCents, 0n),
    debtCents: debt.reduce((sum, account) => sum + account.valuedCents, 0n),
    accounts: input.accounts.map(accountRow),
    currencyTotals: [...currencyMap.entries()].map(([currency, cents]) => ({ currency, cents, formatted: formatCents(cents < 0n ? -cents : cents) })),
  };
}

export function formatValued(cents: bigint, symbol: string): string {
  const negative = cents < 0n;
  return `${negative ? "−" : ""}${symbol}${formatCents(negative ? -cents : cents)}`;
}
