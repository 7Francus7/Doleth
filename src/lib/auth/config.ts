import "server-only";
import { isUsableSessionSecret } from "./session-cookie";

/**
 * Lectura centralizada de configuración. Todo lo sensible vive en variables de
 * entorno del servidor: ningún valor de este módulo puede terminar en el bundle
 * del cliente porque el módulo es `server-only`.
 */

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

export function sessionSecret(): string {
  const secret = process.env.DOLETH_SESSION_SECRET;
  if (!isUsableSessionSecret(secret)) {
    throw new ConfigurationError("DOLETH_SESSION_SECRET falta o tiene menos de 32 caracteres.");
  }
  return secret;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/** URL pública, sin barra final. Se usa para armar los enlaces de los correos. */
export function appUrl(): string {
  const configured = process.env.DOLETH_APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (!isProduction()) return "http://localhost:3000";
  throw new ConfigurationError("DOLETH_APP_URL es obligatoria en producción para armar los enlaces de correo.");
}

export const EMAIL_VERIFICATION_TTL_MINUTES = 60 * 24;
export const PASSWORD_RESET_TTL_MINUTES = 60;
export const EMAIL_CHANGE_TTL_MINUTES = 60;
