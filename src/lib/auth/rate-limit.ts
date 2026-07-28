import "server-only";
import { headers } from "next/headers";
import { getDb } from "../db";
import { pseudonymize } from "./crypto";
import { sessionSecret } from "./config";

/**
 * Rate limiting persistido en Postgres.
 *
 * En memoria no sirve: la app corre en varias instancias serverless y cada una
 * arrancaría con el contador en cero. Una fila por bucket, ventana fija, escritura
 * atómica con `INSERT ... ON CONFLICT`, sin leer-y-después-escribir.
 */

export interface RateLimitRule {
  /** Prefijo del bucket, para separar dominios (login, registro, etc.). */
  name: string;
  limit: number;
  windowSeconds: number;
}

export const RATE_LIMITS = {
  login: { name: "login", limit: 8, windowSeconds: 15 * 60 },
  loginPerIp: { name: "login-ip", limit: 30, windowSeconds: 15 * 60 },
  register: { name: "register", limit: 5, windowSeconds: 60 * 60 },
  passwordReset: { name: "password-reset", limit: 5, windowSeconds: 60 * 60 },
  verificationResend: { name: "verification-resend", limit: 4, windowSeconds: 60 * 60 },
  emailChange: { name: "email-change", limit: 5, windowSeconds: 60 * 60 },
} as const satisfies Record<string, RateLimitRule>;

export interface RateLimitVerdict {
  allowed: boolean;
  retryAfterSeconds: number;
}

interface CounterRow {
  count: number;
  windowStartedAt: Date;
  expiresAt: Date;
}

export async function consumeRateLimit(rule: RateLimitRule, subject: string): Promise<RateLimitVerdict> {
  const bucket = `${rule.name}:${subject}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + rule.windowSeconds * 1000);

  // Una sola sentencia: crea la fila, o reinicia la ventana si venció, o incrementa.
  const rows = await getDb().$queryRaw<CounterRow[]>`
    INSERT INTO "RateLimitCounter" ("bucket", "count", "windowStartedAt", "expiresAt")
    VALUES (${bucket}, 1, ${now}, ${expiresAt})
    ON CONFLICT ("bucket") DO UPDATE SET
      "count" = CASE WHEN "RateLimitCounter"."expiresAt" <= ${now} THEN 1 ELSE "RateLimitCounter"."count" + 1 END,
      "windowStartedAt" = CASE WHEN "RateLimitCounter"."expiresAt" <= ${now} THEN ${now} ELSE "RateLimitCounter"."windowStartedAt" END,
      "expiresAt" = CASE WHEN "RateLimitCounter"."expiresAt" <= ${now} THEN ${expiresAt} ELSE "RateLimitCounter"."expiresAt" END
    RETURNING "count", "windowStartedAt", "expiresAt"
  `;

  const row = rows[0];
  if (!row) return { allowed: true, retryAfterSeconds: 0 };

  const allowed = row.count <= rule.limit;
  return {
    allowed,
    retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil((row.expiresAt.getTime() - now.getTime()) / 1000)),
  };
}

/** Borra un contador tras un intento exitoso, para no castigar a quien acertó. */
export async function clearRateLimit(rule: RateLimitRule, subject: string): Promise<void> {
  await getDb()
    .rateLimitCounter.deleteMany({ where: { bucket: `${rule.name}:${subject}` } })
    .catch(() => undefined);
}

/** Identificador seudonimizado del cliente. Nunca guardamos la IP en claro. */
export async function requestSubject(): Promise<string> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for")?.split(",")[0]?.trim() ?? store.get("x-real-ip") ?? "desconocido";
  return pseudonymize(forwarded, sessionSecret());
}

export function retryMessage(retryAfterSeconds: number): string {
  const minutes = Math.ceil(retryAfterSeconds / 60);
  if (minutes <= 1) return "Demasiados intentos. Probá de nuevo en un minuto.";
  return `Demasiados intentos. Probá de nuevo en ${minutes} minutos.`;
}
