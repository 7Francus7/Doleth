import "server-only";
import { redirect } from "next/navigation";
import type { User } from "../../generated/prisma/client";
import { getSession, type AuthenticatedSession } from "./session";

/**
 * Única fuente de verdad sobre quién está pidiendo algo.
 *
 * Toda página privada, Server Action y consulta de datos pasa por acá. El
 * identificador del propietario sale exclusivamente de la sesión validada contra
 * la base: jamás de un campo del formulario, de la URL o de un header.
 */

export class UnauthorizedError extends Error {
  constructor(message = "Necesitás iniciar sesión para continuar.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/** Para Server Components: redirige al login preservando el destino pedido. */
export async function requireSession(returnTo?: string): Promise<AuthenticatedSession> {
  const session = await getSession();
  if (!session) {
    const target = returnTo && returnTo.startsWith("/") ? `?destino=${encodeURIComponent(returnTo)}` : "";
    redirect(`/iniciar-sesion${target}`);
  }
  return session;
}

export async function requireUser(returnTo?: string): Promise<User> {
  return (await requireSession(returnTo)).user;
}

/** Igual que `requireSession`, pero además exige onboarding terminado. */
export async function requireOnboardedUser(returnTo?: string): Promise<User> {
  const user = await requireUser(returnTo);
  if (!user.onboardingCompletedAt) redirect("/onboarding");
  return user;
}

/**
 * Para Server Actions: nunca redirige, lanza. Las acciones devuelven estado de
 * error al formulario en lugar de una navegación sorpresiva.
 */
export async function requireUserForAction(): Promise<User> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  return session.user;
}

export async function requireSessionForAction(): Promise<AuthenticatedSession> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  return session;
}

/**
 * Guardia de las acciones financieras: además de la sesión, exige onboarding
 * terminado, porque antes de eso el usuario todavía no tiene catálogo de
 * categorías ni preferencias resueltas.
 */
export async function requireOnboardedUserForAction(): Promise<User> {
  const user = await requireUserForAction();
  if (!user.onboardingCompletedAt) {
    throw new UnauthorizedError("Terminá la configuración inicial antes de registrar datos.");
  }
  return user;
}

export async function getOptionalUser(): Promise<User | null> {
  return (await getSession())?.user ?? null;
}
