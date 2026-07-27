import type { PlanKey, SubscriptionStatus, User } from "../../generated/prisma/client";

/**
 * Resolución centralizada de capacidades.
 *
 * Nadie fuera de este archivo debería preguntar `planKey === "PRO"`. Las pantallas
 * preguntan por capacidades (`can(user, "investments")`), así que cuando exista una
 * estrategia comercial alcanza con mover la tabla de abajo.
 *
 * Decisión de esta fase: todo usuario aprobado recibe el conjunto completo. No hay
 * ninguna función bloqueada todavía, y no se integra ninguna pasarela de pago.
 */

export type Capability =
  | "accounts"
  | "movements"
  | "upcomingPayments"
  | "investments"
  | "insights"
  | "export";

const BASE_CAPABILITIES: readonly Capability[] = [
  "accounts",
  "movements",
  "upcomingPayments",
  "investments",
  "insights",
  "export",
];

const CAPABILITIES_BY_PLAN: Record<PlanKey, readonly Capability[]> = {
  BASE: BASE_CAPABILITIES,
  PRO: BASE_CAPABILITIES,
};

/** Estados de suscripción que habilitan el producto. */
const ENTITLED_STATUSES: readonly SubscriptionStatus[] = ["FREE", "TRIAL", "ACTIVE", "PAST_DUE"];

export interface Entitlements {
  planKey: PlanKey;
  subscriptionStatus: SubscriptionStatus;
  capabilities: readonly Capability[];
  /** Vencimiento relevante para la UI (fin de prueba o de período pago). */
  expiresAt: Date | null;
}

type PlanFields = Pick<
  User,
  "planKey" | "subscriptionStatus" | "subscriptionEndsAt" | "trialEndsAt"
>;

export function resolveEntitlements(user: PlanFields): Entitlements {
  const entitled = ENTITLED_STATUSES.includes(user.subscriptionStatus);
  return {
    planKey: user.planKey,
    subscriptionStatus: user.subscriptionStatus,
    capabilities: entitled ? CAPABILITIES_BY_PLAN[user.planKey] : [],
    expiresAt: user.subscriptionStatus === "TRIAL" ? user.trialEndsAt : user.subscriptionEndsAt,
  };
}

export function can(user: PlanFields, capability: Capability): boolean {
  return resolveEntitlements(user).capabilities.includes(capability);
}

export const PLAN_LABELS: Record<PlanKey, string> = {
  BASE: "Doleth Base",
  PRO: "Doleth Pro",
};

export const SUBSCRIPTION_LABELS: Record<SubscriptionStatus, string> = {
  FREE: "Sin costo",
  TRIAL: "Período de prueba",
  ACTIVE: "Activa",
  PAST_DUE: "Pago pendiente",
  CANCELED: "Cancelada",
};
