/**
 * Sobre firmada de la cookie de sesión.
 *
 * La cookie no transporta identidad: sólo un token opaco, su vencimiento y una
 * firma HMAC. El proxy (edge) verifica firma y vencimiento sin tocar la base para
 * decidir a dónde redirigir; la autorización real la hace `getSession()` contra
 * la tabla `Session` en cada request de servidor.
 *
 * Este archivo se importa desde el edge, así que sólo usa Web Crypto.
 */
import { hmacBase64Url, timingSafeEqualText } from "./crypto";

export const SESSION_COOKIE_NAME = "doleth_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const VERSION = "v1";

export function isUsableSessionSecret(secret: string | undefined): secret is string {
  return typeof secret === "string" && secret.length >= 32;
}

export async function sealSessionCookie(token: string, secret: string, expiresAt: Date): Promise<string> {
  const expiresAtSeconds = Math.floor(expiresAt.getTime() / 1000);
  const payload = `${VERSION}.${token}.${expiresAtSeconds}`;
  return `${payload}.${await hmacBase64Url(secret, payload)}`;
}

export interface OpenedSessionCookie {
  token: string;
  expiresAtSeconds: number;
}

/**
 * Devuelve el token sólo si la firma es válida y la sobre no venció.
 * No confirma que la sesión exista: eso lo resuelve la base.
 */
export async function openSessionCookie(
  cookieValue: string | undefined,
  secret: string,
  now = Date.now(),
): Promise<OpenedSessionCookie | null> {
  if (!cookieValue) return null;
  const parts = cookieValue.split(".");
  if (parts.length !== 4) return null;
  const [version, token, expiresText, signature] = parts as [string, string, string, string];
  if (version !== VERSION || !token || !signature) return null;

  const expiresAtSeconds = Number(expiresText);
  if (!Number.isSafeInteger(expiresAtSeconds) || expiresAtSeconds <= Math.floor(now / 1000)) return null;

  const expected = await hmacBase64Url(secret, `${version}.${token}.${expiresText}`);
  if (!timingSafeEqualText(expected, signature)) return null;

  return { token, expiresAtSeconds };
}
