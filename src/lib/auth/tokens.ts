import "server-only";
import type { AuthToken, AuthTokenPurpose } from "../../generated/prisma/client";
import { getDb } from "../db";
import { randomToken, sha256Hex } from "./crypto";

/**
 * Tokens de un solo uso para verificación de correo, recuperación de contraseña
 * y cambio de email.
 *
 * El valor en claro existe únicamente dentro del correo. La base guarda su
 * SHA-256, así que un volcado de `AuthToken` no permite construir enlaces válidos.
 */

export interface IssuedToken {
  /** Sólo para el correo. Nunca se registra ni se devuelve al cliente. */
  token: string;
  expiresAt: Date;
}

/**
 * Emite un token nuevo e invalida los anteriores del mismo propósito: pedir un
 * enlace nuevo siempre desactiva el viejo.
 */
export async function issueToken(
  userId: string,
  purpose: AuthTokenPurpose,
  ttlMinutes: number,
  newEmail?: string,
): Promise<IssuedToken> {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  const db = getDb();

  await db.$transaction([
    db.authToken.updateMany({
      where: { userId, purpose, consumedAt: null },
      data: { consumedAt: new Date() },
    }),
    db.authToken.create({
      data: {
        userId,
        purpose,
        tokenHash: await sha256Hex(token),
        expiresAt,
        ...(newEmail ? { newEmail } : {}),
      },
    }),
  ]);

  return { token, expiresAt };
}

export type TokenFailure = "missing" | "invalid" | "expired" | "used";

export type TokenLookup =
  | { ok: true; token: AuthToken }
  | { ok: false; reason: TokenFailure };

/** Sólo mira: no consume. Sirve para mostrar el estado antes de pedir una acción. */
export async function inspectToken(
  raw: string | undefined,
  purpose: AuthTokenPurpose,
): Promise<TokenLookup> {
  if (!raw) return { ok: false, reason: "missing" };

  const token = await getDb().authToken.findUnique({ where: { tokenHash: await sha256Hex(raw) } });
  if (!token || token.purpose !== purpose) return { ok: false, reason: "invalid" };
  if (token.consumedAt) return { ok: false, reason: "used" };
  if (token.expiresAt.getTime() <= Date.now()) return { ok: false, reason: "expired" };
  return { ok: true, token };
}

/**
 * Consume el token de forma atómica. El `updateMany` con `consumedAt: null` en el
 * filtro garantiza que dos requests simultáneos no puedan usar el mismo enlace.
 */
export async function consumeToken(
  raw: string | undefined,
  purpose: AuthTokenPurpose,
): Promise<TokenLookup> {
  const lookup = await inspectToken(raw, purpose);
  if (!lookup.ok) return lookup;

  const claimed = await getDb().authToken.updateMany({
    where: { id: lookup.token.id, consumedAt: null, expiresAt: { gt: new Date() } },
    data: { consumedAt: new Date() },
  });
  if (claimed.count !== 1) return { ok: false, reason: "used" };

  return lookup;
}

export const TOKEN_FAILURE_MESSAGES: Record<TokenFailure, string> = {
  missing: "El enlace está incompleto. Pedí uno nuevo para continuar.",
  invalid: "Este enlace no es válido. Pedí uno nuevo para continuar.",
  expired: "El enlace venció. Pedí uno nuevo para continuar.",
  used: "Este enlace ya se usó. Pedí uno nuevo si lo necesitás otra vez.",
};
