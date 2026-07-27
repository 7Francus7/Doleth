import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import type { User } from "../../generated/prisma/client";
import { getDb } from "../db";
import { pseudonymize, randomToken, sha256Hex } from "./crypto";
import { isProduction, sessionSecret } from "./config";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  openSessionCookie,
  sealSessionCookie,
} from "./session-cookie";

export interface AuthenticatedSession {
  sessionId: string;
  user: User;
}

async function requestFingerprint(): Promise<{ userAgent: string | null; ipHash: string | null }> {
  const store = await headers();
  const userAgent = store.get("user-agent")?.slice(0, 200) ?? null;
  const forwarded = store.get("x-forwarded-for")?.split(",")[0]?.trim() ?? store.get("x-real-ip") ?? null;
  return {
    userAgent,
    ipHash: forwarded ? await pseudonymize(forwarded, sessionSecret()) : null,
  };
}

/**
 * Crea la sesión en la base y deja la cookie firmada.
 * El token viaja sólo en la cookie; la base guarda únicamente su SHA-256.
 */
export async function createSession(userId: string): Promise<void> {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  const { userAgent, ipHash } = await requestFingerprint();

  await getDb().session.create({
    data: {
      userId,
      tokenHash: await sha256Hex(token),
      expiresAt,
      ...(userAgent ? { userAgent } : {}),
      ...(ipHash ? { ipHash } : {}),
    },
  });

  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, await sealSessionCookie(token, sessionSecret(), expiresAt), {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    expires: expiresAt,
  });
}

/**
 * Sesión efectiva del request. Memoizada por request con `cache()` para que un
 * árbol de Server Components no golpee la base una vez por componente.
 *
 * Valida, en este orden: firma de la cookie, existencia de la sesión, revocación,
 * vencimiento y estado del usuario. Cualquier falla devuelve `null` (fail-closed).
 */
export const getSession = cache(async (): Promise<AuthenticatedSession | null> => {
  let secret: string;
  try {
    secret = sessionSecret();
  } catch {
    return null;
  }

  const store = await cookies();
  const opened = await openSessionCookie(store.get(SESSION_COOKIE_NAME)?.value, secret);
  if (!opened) return null;

  const session = await getDb().session.findUnique({
    where: { tokenHash: await sha256Hex(opened.token) },
    include: { user: true },
  });

  if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) return null;
  if (session.user.status !== "ACTIVE") return null;
  // Cambiar la contraseña invalida todo lo emitido antes, incluso si la fila
  // de sesión sobrevivió a una revocación parcial.
  if (session.user.passwordChangedAt.getTime() > session.createdAt.getTime()) return null;

  return { sessionId: session.id, user: session.user };
});

/** Revoca la sesión del request actual y borra la cookie. */
export async function destroyCurrentSession(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE_NAME)?.value;
  store.delete(SESSION_COOKIE_NAME);
  if (!raw) return null;

  let secret: string;
  try {
    secret = sessionSecret();
  } catch {
    return null;
  }

  const opened = await openSessionCookie(raw, secret);
  if (!opened) return null;

  const result = await getDb().session.updateMany({
    where: { tokenHash: await sha256Hex(opened.token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return result.count > 0 ? "revoked" : null;
}

/** Revoca todas las sesiones del usuario, opcionalmente preservando la actual. */
export async function revokeUserSessions(userId: string, exceptSessionId?: string): Promise<number> {
  const result = await getDb().session.updateMany({
    where: {
      userId,
      revokedAt: null,
      ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
    },
    data: { revokedAt: new Date() },
  });
  return result.count;
}

export async function listActiveSessions(userId: string) {
  return getDb().session.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastSeenAt: "desc" },
    select: { id: true, createdAt: true, lastSeenAt: true, userAgent: true },
  });
}
