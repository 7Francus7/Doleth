import { formatCentsAR, parseAmountInput } from "./amount";

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

/**
 * Lee un importe escrito por una persona y devuelve centavos exactos.
 *
 * Usa la misma lectura que el campo del formulario (`parseAmountInput`) y no una
 * propia. Antes eran dos: el cliente entendía "12.500" como doce mil quinientos
 * —que es como se escribe acá— y el servidor lo rechazaba por tener tres
 * decimales. La diferencia sólo aparecía en los formularios que no usan el campo
 * de importe con normalización: el saldo inicial de una cuenta, el valor de una
 * inversión, el importe de un pago previsto y los gastos fijos del onboarding.
 * En todos ellos, escribir el precio de la forma natural devolvía un error
 * genérico que no explicaba nada.
 *
 * El signo se resuelve acá porque `parseAmountInput` no admite negativos: la
 * deuda de una tarjeta se carga en negativo y es el único caso del producto.
 */
export function parseMoneyToCents(value: string, allowNegative = false): bigint {
  const raw = value.trim().replace(/\s|\$/g, "");
  const negative = raw.startsWith("-");
  if (negative && !allowNegative) {
    throw new Error("Ingresá un importe válido con hasta dos decimales.");
  }

  const reading = parseAmountInput(negative ? raw.slice(1) : raw);
  if (reading.cents === null) {
    throw new Error(
      reading.error === "too-large"
        ? "El importe es demasiado grande."
        : "Ingresá un importe válido con hasta dos decimales.",
    );
  }
  return negative ? -reading.cents : reading.cents;
}

export function requirePositiveMoney(value: string): bigint {
  const cents = parseMoneyToCents(value);
  if (cents <= 0n) throw new Error("El importe debe ser mayor que cero.");
  return cents;
}

/**
 * Asientos de un movimiento.
 *
 * `destinationAmountCents` existe sólo para la transferencia entre cuentas de
 * monedas distintas: sale una cantidad de pesos y entra una cantidad de dólares,
 * y cada asiento queda expresado en la moneda de su cuenta. Sin ese segundo
 * importe, el asiento de destino heredaría el número del origen y la cuenta en
 * dólares terminaría con un saldo de pesos adentro.
 *
 * Cuando las dos puntas comparten moneda se omite: entra y sale exactamente lo
 * mismo, y guardarlo dos veces sería crear dos verdades que pueden separarse.
 */
export function createPostings(
  type: MovementType,
  amountCents: bigint,
  sourceAccountId: string,
  destinationAccountId?: string,
  destinationAmountCents?: bigint,
): LedgerPosting[] {
  if (amountCents <= 0n) throw new Error("El importe debe ser mayor que cero.");
  if (!sourceAccountId) throw new Error("Seleccioná una cuenta.");

  if (type !== "TRANSFER" && destinationAmountCents !== undefined) {
    throw new Error("Sólo una transferencia acredita un importe distinto en destino.");
  }

  if (type === "INCOME") return [{ accountId: sourceAccountId, amountCents }];
  if (type === "EXPENSE") return [{ accountId: sourceAccountId, amountCents: -amountCents }];

  if (!destinationAccountId) throw new Error("Seleccioná la cuenta de destino.");
  if (destinationAccountId === sourceAccountId) {
    throw new Error("La cuenta de destino debe ser distinta de la cuenta de origen.");
  }
  if (destinationAmountCents !== undefined && destinationAmountCents <= 0n) {
    throw new Error("El importe acreditado debe ser mayor que cero.");
  }

  return [
    { accountId: sourceAccountId, amountCents: -amountCents },
    { accountId: destinationAccountId, amountCents: destinationAmountCents ?? amountCents },
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

export function formatDateAR(value: Date | string): string {
  const date = typeof value === "string" ? new Date(`${value}T00:00:00.000Z`) : value;
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
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

/**
 * Lectura argentina de un importe. Delega en el formateador consolidado de
 * `amount.ts` para que todo el producto muestre el mismo número: la versión
 * anterior pasaba por `Number`, que pierde precisión con importes grandes y
 * mostraba "12.500,5" donde el resto de la app muestra "12.500,50".
 */
export function formatCents(cents: bigint): string {
  return formatCentsAR(cents);
}
