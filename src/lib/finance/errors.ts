/**
 * Errores financieros con mensaje apto para mostrar.
 *
 * Solo los errores que Doleth levanta a propósito llegan a la pantalla. Cualquier
 * otra falla (Prisma, red, SQL) se traduce a un mensaje humano: nunca se filtra
 * un stack, una constraint ni un identificador interno.
 */
export class FinanceError extends Error {
  readonly code: string;
  readonly field: string | undefined;

  constructor(code: string, message: string, field?: string) {
    super(message);
    this.name = "FinanceError";
    this.code = code;
    this.field = field;
  }
}

export const financeError = (code: string, message: string, field?: string) => new FinanceError(code, message, field);

export interface SafeError {
  code: string;
  message: string;
  field: string | undefined;
}

const GENERIC: SafeError = {
  code: "unexpected",
  message: "No pudimos guardar el cambio. Los datos que escribiste siguen acá. Revisalos e intentá nuevamente.",
  field: undefined,
};

/** Traduce cualquier excepción a algo que se pueda mostrar sin exponer el interior. */
export function toSafeError(error: unknown): SafeError {
  if (error instanceof FinanceError) {
    return { code: error.code, message: error.message, field: error.field };
  }
  return GENERIC;
}
