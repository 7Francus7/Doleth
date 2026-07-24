/**
 * Repetir un movimiento anterior.
 *
 * Repetir siempre crea un movimiento nuevo: se copia la intención (qué, cuánto,
 * dónde) y nunca la identidad ni la auditoría del anterior. La fecha es hoy.
 */
import type { MovementType } from "./domain";

export interface RepeatableMovement {
  id: string;
  type: MovementType;
  amountCents: bigint;
  sourceAccountId: string;
  destinationAccountId: string | null;
  categoryId: string | null;
  description: string | null;
  voidedAt: Date | null;
  /** Id del reemplazo vigente, si este movimiento fue corregido. */
  correctionId: string | null;
}

export interface RepeatDefaults {
  type: MovementType;
  amount: string;
  sourceAccountId: string;
  destinationAccountId: string;
  categoryId: string;
  description: string;
  occurredOn: string;
}

/**
 * Un movimiento corregido no es la versión vigente: repetirlo copiaría datos que
 * ya fueron reemplazados. Quien manda es la corrección.
 */
export function currentVersionId(movement: RepeatableMovement): string {
  return movement.correctionId ?? movement.id;
}

/** Un movimiento corregido nunca se repite: hay que ir a su reemplazo. */
export function canRepeat(movement: RepeatableMovement): boolean {
  return movement.correctionId === null;
}

/**
 * Un anulado puede servir de referencia —la intención sigue siendo válida— pero
 * la interfaz debe decirlo, porque el movimiento que se cree es nuevo y sí cuenta.
 */
export function isReferenceOnly(movement: RepeatableMovement): boolean {
  return movement.voidedAt !== null;
}

export function buildRepeatDefaults(
  movement: RepeatableMovement,
  todayIso: string,
  formatAmount: (cents: bigint) => string,
): RepeatDefaults {
  return {
    type: movement.type,
    amount: formatAmount(movement.amountCents),
    sourceAccountId: movement.sourceAccountId,
    destinationAccountId: movement.destinationAccountId ?? "",
    categoryId: movement.categoryId ?? "",
    description: movement.description ?? "",
    // Fecha nueva: repetir no arrastra el día del movimiento anterior.
    occurredOn: todayIso,
  };
}
