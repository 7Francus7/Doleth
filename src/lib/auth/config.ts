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

export type AccessMode = "private-beta" | "public";

/**
 * El registro es pÃºblico por defecto. Para volver a una beta por invitaciÃ³n,
 * configurÃ¡ explÃ­citamente DOLETH_ACCESS_MODE=private-beta.
 */
export function accessMode(): AccessMode {
  const configured = process.env.DOLETH_ACCESS_MODE?.trim() || "public";
  if (configured !== "private-beta" && configured !== "public") {
    throw new ConfigurationError("DOLETH_ACCESS_MODE debe ser private-beta o public.");
  }
  return configured;
}

export function publicEmailAuthEnabled(): boolean {
  return accessMode() === "public";
}

function canonicalHttpsUrl(raw: string, variable: string): string {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new ConfigurationError(`${variable} no contiene una URL válida.`);
  }

  if (isProduction() && parsed.protocol !== "https:") {
    throw new ConfigurationError(`${variable} debe usar HTTPS en un deployment.`);
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash || (parsed.pathname && parsed.pathname !== "/")) {
    throw new ConfigurationError(`${variable} debe contener sólo el origen público, sin credenciales, path, query ni hash.`);
  }
  return parsed.origin;
}

/** URL pública, sin barra final. Se usa para armar los enlaces de los correos. */
export function appUrl(): string {
  const configured = process.env.DOLETH_APP_URL?.trim();
  const target = process.env.VERCEL_TARGET_ENV ?? process.env.VERCEL_ENV;
  const isPreview = target === "preview";
  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim().toLowerCase();

  if (configured) {
    const canonical = canonicalHttpsUrl(configured, "DOLETH_APP_URL");
    if (isPreview && productionHost && new URL(canonical).host.toLowerCase() === productionHost) {
      throw new ConfigurationError("DOLETH_APP_URL de Preview no puede apuntar al host productivo.");
    }
    return canonical;
  }

  if (isPreview) {
    const previewHost = process.env.VERCEL_URL?.trim();
    if (!previewHost) {
      throw new ConfigurationError("VERCEL_URL es obligatoria en Preview cuando DOLETH_APP_URL no está configurada.");
    }
    return canonicalHttpsUrl(`https://${previewHost}`, "VERCEL_URL");
  }

  if (productionHost) return canonicalHttpsUrl(`https://${productionHost}`, "VERCEL_PROJECT_PRODUCTION_URL");
  if (process.env.VERCEL_URL) return canonicalHttpsUrl(`https://${process.env.VERCEL_URL}`, "VERCEL_URL");
  if (!isProduction()) return "http://localhost:3000";
  throw new ConfigurationError("DOLETH_APP_URL es obligatoria en producción para armar los enlaces de correo.");
}

export const EMAIL_VERIFICATION_TTL_MINUTES = 60 * 24;
export const PASSWORD_RESET_TTL_MINUTES = 60;
export const EMAIL_CHANGE_TTL_MINUTES = 60;
export const PRIVATE_BETA_INVITE_TTL_MINUTES = 60 * 24 * 7;
export const ADMIN_PASSWORD_RESET_TTL_MINUTES = 30;
