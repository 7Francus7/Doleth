export type MovementType = "EXPENSE" | "INCOME" | "TRANSFER";

export interface LedgerPosting {
  accountId: string;
  amountCents: bigint;
}

export interface MonthlyMovement {
  type: MovementType;
  amountCents: bigint;
  voidedAt: Date | null;
}

export function parseMoneyToCents(value: string, allowNegative = false): bigint {
  const raw = value.trim().replace(/\s|\$/g, "");
  const normalized = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw;
  const pattern = allowNegative ? /^-?\d+(?:\.\d{1,2})?$/ : /^\d+(?:\.\d{1,2})?$/;

  if (!pattern.test(normalized)) {
    throw new Error("Ingresá un importe válido con hasta dos decimales.");
  }

  const negative = normalized.startsWith("-");
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [whole = "0", fraction = ""] = unsigned.split(".");
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  return negative ? -cents : cents;
}

export function requirePositiveMoney(value: string): bigint {
  const cents = parseMoneyToCents(value);
  if (cents <= 0n) throw new Error("El importe debe ser mayor que cero.");
  return cents;
}

export function createPostings(
  type: MovementType,
  amountCents: bigint,
  sourceAccountId: string,
  destinationAccountId?: string,
): LedgerPosting[] {
  if (amountCents <= 0n) throw new Error("El importe debe ser mayor que cero.");
  if (!sourceAccountId) throw new Error("Seleccioná una cuenta.");

  if (type === "INCOME") return [{ accountId: sourceAccountId, amountCents }];
  if (type === "EXPENSE") return [{ accountId: sourceAccountId, amountCents: -amountCents }];

  if (!destinationAccountId) throw new Error("Seleccioná la cuenta de destino.");
  if (destinationAccountId === sourceAccountId) {
    throw new Error("La cuenta de destino debe ser distinta de la cuenta de origen.");
  }

  return [
    { accountId: sourceAccountId, amountCents: -amountCents },
    { accountId: destinationAccountId, amountCents },
  ];
}

export function applyPostings(
  balances: Readonly<Record<string, bigint>>,
  postings: readonly LedgerPosting[],
): Record<string, bigint> {
  const result = { ...balances };
  for (const posting of postings) {
    result[posting.accountId] = (result[posting.accountId] ?? 0n) + posting.amountCents;
  }
  return result;
}

export function reversePostings(postings: readonly LedgerPosting[]): LedgerPosting[] {
  return postings.map((posting) => ({ ...posting, amountCents: -posting.amountCents }));
}

export function summarizeMonth(movements: readonly MonthlyMovement[]) {
  return movements.reduce(
    (summary, movement) => {
      if (movement.voidedAt) return summary;
      if (movement.type === "INCOME") summary.incomeCents += movement.amountCents;
      if (movement.type === "EXPENSE") summary.expenseCents += movement.amountCents;
      summary.balanceCents = summary.incomeCents - summary.expenseCents;
      return summary;
    },
    { incomeCents: 0n, expenseCents: 0n, balanceCents: 0n },
  );
}

export function idempotencyDecision(existingTransactionId: string | null): "CREATE" | "RETURN_EXISTING" {
  return existingTransactionId ? "RETURN_EXISTING" : "CREATE";
}

export function paymentConversionDecision(
  status: "PENDING" | "PAID",
  transactionId: string | null,
): "CREATE" | "RETURN_EXISTING" {
  if (status === "PAID" && transactionId) return "RETURN_EXISTING";
  if (status === "PAID" || transactionId) throw new Error("Estado de próximo pago inconsistente.");
  return "CREATE";
}

export function todayInArgentina(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function monthBounds(month: string): { start: Date; end: Date } {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error("Mes inválido.");
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  return {
    start: new Date(Date.UTC(year, monthIndex, 1)),
    end: new Date(Date.UTC(year, monthIndex + 1, 1)),
  };
}

export function dateOnly(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Fecha inválida.");
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error("Fecha inválida.");
  }
  return date;
}

export function formatCents(cents: bigint): string {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(cents) / 100);
}
