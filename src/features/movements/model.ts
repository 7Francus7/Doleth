import { normalizeListPath } from "../../lib/navigation/scrollRestoration";

export type MovementType = "EXPENSE" | "INCOME" | "TRANSFER";

export interface MovementQuery {
  month: string;
  type?: MovementType;
  accountId?: string;
  categoryId?: string;
  q?: string;
  min?: string;
  max?: string;
  page: number;
}

export interface MovementListItem {
  id: string;
  type: MovementType;
  amount: string;
  currency: string;
  occurredOn: string;
  description: string;
  categoryName: string | null;
  sourceAccountName: string;
  destinationAccountName: string | null;
  voided: boolean;
  corrected: boolean;
}

const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
const clean = (value: string | string[] | undefined, max = 80) => first(value)?.trim().slice(0, max) || undefined;

export function parseMovementQuery(
  params: Record<string, string | string[] | undefined>,
  today: string,
): MovementQuery {
  const requestedMonth = clean(params.month, 7);
  const month = requestedMonth && /^\d{4}-(0[1-9]|1[0-2])$/.test(requestedMonth)
    ? requestedMonth
    : today.slice(0, 7);
  const requestedType = clean(params.type, 12);
  const type = requestedType === "EXPENSE" || requestedType === "INCOME" || requestedType === "TRANSFER"
    ? requestedType
    : undefined;
  const requestedPage = Number.parseInt(clean(params.page, 6) ?? "1", 10);
  const accountId = clean(params.accountId);
  const categoryId = clean(params.categoryId);
  const q = clean(params.q);
  const min = clean(params.min, 24);
  const max = clean(params.max, 24);

  return {
    month,
    ...(type ? { type } : {}),
    ...(accountId ? { accountId } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(q ? { q } : {}),
    ...(min ? { min } : {}),
    ...(max ? { max } : {}),
    page: Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
  };
}

type MovementQueryOverrides = { [Key in keyof MovementQuery]?: MovementQuery[Key] | undefined };

export function movementPath(query: MovementQuery, overrides: MovementQueryOverrides = {}): string {
  const next = { ...query, ...overrides };
  return normalizeListPath("/movimientos", {
    month: next.month,
    type: next.type,
    accountId: next.accountId,
    categoryId: next.categoryId,
    q: next.q,
    min: next.min,
    max: next.max,
    ...((next.page ?? 1) > 1 ? { page: String(next.page) } : {}),
  });
}

export function activeMovementFilterCount(query: MovementQuery, currentMonth: string): number {
  return [
    query.month !== currentMonth,
    Boolean(query.type),
    Boolean(query.accountId),
    Boolean(query.categoryId),
    Boolean(query.q),
    Boolean(query.min),
    Boolean(query.max),
  ].filter(Boolean).length;
}

export function previousDay(day: string): string {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function movementDayLabel(day: string, today: string): string {
  if (day === today) return "HOY";
  if (day === previousDay(today)) return "AYER";
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", timeZone: "UTC" })
    .format(new Date(`${day}T00:00:00.000Z`))
    .replace(".", "")
    .toLocaleUpperCase("es-AR");
}

export function groupMovementsByDay(movements: readonly MovementListItem[], today: string) {
  const groups: { day: string; label: string; movements: MovementListItem[] }[] = [];
  for (const movement of movements) {
    const current = groups.at(-1);
    if (current?.day === movement.occurredOn) current.movements.push(movement);
    else groups.push({ day: movement.occurredOn, label: movementDayLabel(movement.occurredOn, today), movements: [movement] });
  }
  return groups;
}

export const movementTypeLabel: Record<MovementType, string> = {
  EXPENSE: "Gasto",
  INCOME: "Ingreso",
  TRANSFER: "Transferencia",
};

export function signedMovementAmount(movement: Pick<MovementListItem, "type" | "amount" | "currency">): string {
  const sign = movement.type === "EXPENSE" ? "−" : movement.type === "INCOME" ? "+" : "";
  const currency = movement.currency === "ARS" ? "$" : `${movement.currency} `;
  return `${sign}${currency}${movement.amount}`;
}
