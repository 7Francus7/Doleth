import "server-only";
import { headers } from "next/headers";
import type { AuthEventType } from "../../generated/prisma/enums";
import { getDb } from "../db";
import { pseudonymize } from "./crypto";
import { sessionSecret } from "./config";

/**
 * Bitácora de eventos sensibles.
 *
 * Regla dura: acá no entra nada secreto. Ni contraseñas, ni tokens (ni parciales),
 * ni importes, ni nombres de cuentas. El email y la IP se guardan seudonimizados
 * con HMAC, de modo que sirven para correlacionar sin ser reversibles.
 *
 * Auditar nunca puede romper el flujo del usuario: si la escritura falla, se
 * registra en el log del servidor y la operación continúa.
 */

export interface AuditInput {
  type: AuthEventType;
  userId?: string | null;
  email?: string | null;
  success?: boolean;
  /** Etiqueta corta y no sensible, p. ej. "credenciales_invalidas". */
  context?: string;
}

export async function recordAuthEvent(input: AuditInput): Promise<void> {
  try {
    const secret = sessionSecret();
    const store = await headers();
    const userAgent = store.get("user-agent")?.slice(0, 200) ?? null;
    const forwarded = store.get("x-forwarded-for")?.split(",")[0]?.trim() ?? store.get("x-real-ip") ?? null;

    await getDb().authEvent.create({
      data: {
        type: input.type,
        success: input.success ?? true,
        ...(input.userId ? { userId: input.userId } : {}),
        ...(input.email ? { emailHash: await pseudonymize(input.email, secret) } : {}),
        ...(input.context ? { context: input.context.slice(0, 120) } : {}),
        ...(userAgent ? { userAgent } : {}),
        ...(forwarded ? { ipHash: await pseudonymize(forwarded, secret) } : {}),
      },
    });
  } catch (error) {
    console.error("[auth] no se pudo registrar el evento de auditoría", {
      type: input.type,
      reason: error instanceof Error ? error.name : "desconocido",
    });
  }
}
