import "server-only";

export interface ServerErrorContext {
  route: string;
  operation: string;
  code: string;
}

/**
 * Registra solo contexto controlado. La excepción original se omite para no
 * filtrar importes, nombres, descripciones, cookies ni configuración.
 */
export function logServerError(context: ServerErrorContext): string {
  const reference = crypto.randomUUID().slice(0, 8);
  console.error(JSON.stringify({
    level: "error",
    ...context,
    reference,
    timestamp: new Date().toISOString(),
  }));
  return reference;
}
