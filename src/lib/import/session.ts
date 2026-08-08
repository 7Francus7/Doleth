import "server-only";
import { createHash } from "node:crypto";
import type { ColumnMapping } from "./detect";
import type { DateOrder } from "./normalize";
import type { SignConvention } from "./plan";

/**
 * Cómo se leyó un archivo.
 *
 * Se guarda con el lote para poder explicar más adelante por qué una fila quedó
 * como quedó. Sin esto, un movimiento importado con la fecha corrida es
 * indistinguible de uno cargado mal a mano, y no hay forma de saber que el
 * problema fue el orden de fecha y no la persona.
 */
export interface ImportSettings {
  mapping: ColumnMapping;
  dateOrder: DateOrder;
  signConvention: SignConvention;
  delimiter: string;
  encoding: string;
  hasHeader: boolean;
}

export const serializeSettings = (settings: ImportSettings): string => JSON.stringify(settings);

/**
 * Lee la configuración guardada.
 *
 * Tolera un JSON corrupto devolviendo `null`: la configuración es evidencia
 * útil, no un dato del que dependa el ledger, y romper la pantalla de historial
 * porque una fila vieja tiene un JSON raro sería desproporcionado.
 */
export function parseSettings(raw: string): ImportSettings | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed as ImportSettings;
  } catch {
    return null;
  }
}

/**
 * Huella del contenido de un archivo.
 *
 * Permite reconocer un archivo ya importado aunque venga con otro nombre, que es
 * exactamente lo que hacen los homebanking: el mismo período descargado dos
 * veces sale como `movimientos.csv` y `movimientos (1).csv`.
 */
export const fileFingerprint = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");
