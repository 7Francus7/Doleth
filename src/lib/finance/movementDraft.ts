/**
 * Borradores locales de formularios de movimiento.
 *
 * Viven solo en el dispositivo (sessionStorage/localStorage del navegador): no
 * hay modelo nuevo ni escritura en la base. Nunca guardan la idempotency key
 * consumida, ni identificadores del movimiento creado, ni estados de error.
 */
export type DraftScope = { kind: "new" } | { kind: "correction"; movementId: string };

/** Un borrador viejo deja de ser útil y puede confundir: se descarta a las 24 horas. */
export const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface MovementDraftValues {
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  amount: string;
  sourceAccountId: string;
  destinationAccountId: string;
  categoryId: string;
  occurredOn: string;
  description: string;
}

export interface StoredDraft {
  values: MovementDraftValues;
  returnTo: string | null;
  savedAt: number;
}

/** Nuevo y corrección nunca comparten borrador, y cada corrección tiene el suyo. */
export function draftStorageKey(scope: DraftScope): string {
  return scope.kind === "new" ? "doleth:draft:movimiento:nuevo" : `doleth:draft:movimiento:correccion:${scope.movementId}`;
}

/** ¿Hay algo escrito que valga la pena conservar? El tipo por sí solo no cuenta. */
export function isDraftWorthKeeping(values: MovementDraftValues, initial: MovementDraftValues): boolean {
  return (
    values.amount.trim() !== initial.amount.trim() ||
    values.sourceAccountId !== initial.sourceAccountId ||
    values.destinationAccountId !== initial.destinationAccountId ||
    values.categoryId !== initial.categoryId ||
    values.occurredOn !== initial.occurredOn ||
    values.description.trim() !== initial.description.trim() ||
    values.type !== initial.type
  );
}

export function serializeDraft(values: MovementDraftValues, returnTo: string | null, now: number): string {
  const payload: StoredDraft = { values, returnTo, savedAt: now };
  return JSON.stringify(payload);
}

/**
 * Devuelve el borrador solo si sigue siendo legible y vigente.
 * Ante cualquier duda devuelve null: preferimos empezar limpio antes que
 * restaurar algo ajeno o corrupto.
 */
export function parseDraft(raw: string | null, now: number, maxAgeMs = DRAFT_MAX_AGE_MS): StoredDraft | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const draft = parsed as Partial<StoredDraft>;
  if (typeof draft.savedAt !== "number" || !Number.isFinite(draft.savedAt)) return null;
  if (now - draft.savedAt > maxAgeMs || draft.savedAt > now) return null;

  const values = draft.values as Partial<MovementDraftValues> | undefined;
  if (!values || typeof values !== "object") return null;
  const type = values.type;
  if (type !== "EXPENSE" && type !== "INCOME" && type !== "TRANSFER") return null;

  const text = (input: unknown) => (typeof input === "string" ? input : "");
  return {
    values: {
      type,
      amount: text(values.amount),
      sourceAccountId: text(values.sourceAccountId),
      destinationAccountId: text(values.destinationAccountId),
      categoryId: text(values.categoryId),
      occurredOn: text(values.occurredOn),
      description: text(values.description),
    },
    returnTo: typeof draft.returnTo === "string" ? draft.returnTo : null,
    savedAt: draft.savedAt,
  };
}
