/**
 * Copy de resultado de las operaciones financieras.
 *
 * Cada éxito nombra el importe y las cuentas reales: nadie debería tener que
 * abrir el detalle para saber qué acaba de pasar.
 */
import { formatCentsAR } from "./amount";
import type { MovementType } from "./domain";

export interface MovementOutcome {
  type: MovementType;
  amountCents: bigint;
  sourceAccountName: string;
  destinationAccountName?: string | undefined;
}

export interface Feedback {
  message: string;
  detail: string;
}

export function successForMovement(outcome: MovementOutcome): Feedback {
  const amount = `$${formatCentsAR(outcome.amountCents)}`;
  if (outcome.type === "EXPENSE") {
    return { message: "Gasto registrado.", detail: `Salieron ${amount} de ${outcome.sourceAccountName}.` };
  }
  if (outcome.type === "INCOME") {
    return { message: "Ingreso registrado.", detail: `Entraron ${amount} en ${outcome.sourceAccountName}.` };
  }
  return {
    message: "Transferencia completada.",
    detail: `${amount} pasaron de ${outcome.sourceAccountName} a ${outcome.destinationAccountName ?? ""}. Tu patrimonio total no cambió.`,
  };
}

export function successForCorrection(): Feedback {
  return {
    message: "Corrección guardada.",
    detail: "El movimiento anterior permanece disponible en el historial.",
  };
}

export function successForVoid(): Feedback {
  return {
    message: "Movimiento anulado.",
    detail: "Ya no afecta tus saldos, pero continúa en el historial.",
  };
}

/** Resumen de una transferencia antes de confirmarla. */
export function transferSummary(amountCents: bigint | null, sourceName: string, destinationName: string): string[] {
  const amount = amountCents === null ? null : `$${formatCentsAR(amountCents)}`;
  return [
    `Sale de ${sourceName || "—"}`,
    `Entra en ${destinationName || "—"}`,
    `Importe ${amount ?? "—"}`,
    "Tu patrimonio total no cambia.",
  ];
}
