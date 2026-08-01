import type { AdminAdoptionEnvironment, AdminAdoptionMetadata } from "./private-beta-admin-adoption";

export interface AdminAdoptionEnv {
  readonly DATABASE_URL?: string;
  readonly TEST_DATABASE_URL?: string;
  readonly DOLETH_ACCESS_MODE?: string;
  readonly DOLETH_ADMIN_ADOPTION_ACTOR?: string;
  readonly DOLETH_ADMIN_ADOPTION_BRANCH_ID?: string;
  readonly DOLETH_ADMIN_ADOPTION_COMMIT?: string;
  readonly DOLETH_ADMIN_ADOPTION_DATABASE_URL?: string;
  readonly DOLETH_ADMIN_ADOPTION_ENVIRONMENT?: string;
  readonly DOLETH_ADMIN_ADOPTION_EXPECTED_DATABASE?: string;
  readonly DOLETH_ADMIN_ADOPTION_EXPECTED_DATABASE_HOST?: string;
  readonly DOLETH_ADMIN_ADOPTION_PRODUCTION_BRANCH_ID?: string;
  readonly DOLETH_ADMIN_ADOPTION_PRODUCTION_DATABASE_HOST?: string;
  readonly DOLETH_ADMIN_ADOPTION_PRODUCTION_PROJECT_ID?: string;
  readonly DOLETH_ADMIN_ADOPTION_PROJECT_ID?: string;
  readonly DOLETH_ADMIN_ADOPTION_REASON?: string;
  readonly DOLETH_ALLOW_PRODUCTION_ADMIN_ADOPTION?: string;
  readonly DOLETH_ALLOW_TEST_ADMIN_ADOPTION?: string;
  readonly NODE_ENV?: string;
  readonly [key: string]: string | undefined;
}

export type AdminAdoptionConfigErrorCode =
  | "DEDICATED_DATABASE_URL_REQUIRED"
  | "INVALID_DATABASE_URL"
  | "UNKNOWN_ENVIRONMENT"
  | "EXPECTED_TARGET_REQUIRED"
  | "EXPECTED_TARGET_MISMATCH"
  | "PRODUCTION_IDENTITY_REQUIRED"
  | "PRODUCTION_SEPARATION_FAILED"
  | "PRODUCTION_FLAG_REQUIRED"
  | "TEST_ENVIRONMENT_FORBIDDEN"
  | "TEST_DATABASE_COLLISION"
  | "PRIVATE_BETA_MODE_REQUIRED"
  | "AUDIT_METADATA_REQUIRED";

export class AdminAdoptionConfigError extends Error {
  constructor(readonly code: AdminAdoptionConfigErrorCode) {
    super(code);
    this.name = "AdminAdoptionConfigError";
  }
}

export interface ResolvedAdminAdoptionConfig {
  connectionString: string;
  database: string;
  environment: AdminAdoptionEnvironment;
  host: string;
  metadata: AdminAdoptionMetadata;
}

interface Target {
  database: string;
  host: string;
  port: string;
}

function parseTarget(raw: string): Target | null {
  try {
    const parsed = new URL(raw);
    if (!/^postgres(ql)?:$/.test(parsed.protocol)) return null;
    const database = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
    if (!database) return null;
    return { database, host: parsed.hostname.toLowerCase(), port: parsed.port || "5432" };
  } catch {
    return null;
  }
}

function sameTarget(left: Target, right: Target): boolean {
  return left.host === right.host && left.port === right.port && left.database === right.database;
}

function required(env: AdminAdoptionEnv, key: keyof AdminAdoptionEnv): string {
  const value = env[key]?.trim();
  if (!value) throw new AdminAdoptionConfigError("PRODUCTION_IDENTITY_REQUIRED");
  return value;
}

function safeAuditValue(value: string, maximum: number): boolean {
  return value.length > 0 && value.length <= maximum && !/[@\r\n]|:\/\/|password|secret|token/i.test(value);
}

export function resolveAdminAdoptionConfig(env: AdminAdoptionEnv): ResolvedAdminAdoptionConfig {
  const connectionString = env.DOLETH_ADMIN_ADOPTION_DATABASE_URL?.trim();
  if (!connectionString) throw new AdminAdoptionConfigError("DEDICATED_DATABASE_URL_REQUIRED");
  const target = parseTarget(connectionString);
  if (!target) throw new AdminAdoptionConfigError("INVALID_DATABASE_URL");

  const rawEnvironment = env.DOLETH_ADMIN_ADOPTION_ENVIRONMENT?.trim().toLowerCase();
  if (!rawEnvironment || !["rehearsal", "preview", "production", "test"].includes(rawEnvironment)) {
    throw new AdminAdoptionConfigError("UNKNOWN_ENVIRONMENT");
  }
  const environment = rawEnvironment as AdminAdoptionEnvironment;
  if (environment === "test" && (env.NODE_ENV !== "test" || env.DOLETH_ALLOW_TEST_ADMIN_ADOPTION !== "YES")) {
    throw new AdminAdoptionConfigError("TEST_ENVIRONMENT_FORBIDDEN");
  }
  if (env.DOLETH_ACCESS_MODE !== "private-beta") {
    throw new AdminAdoptionConfigError("PRIVATE_BETA_MODE_REQUIRED");
  }

  const expectedHost = env.DOLETH_ADMIN_ADOPTION_EXPECTED_DATABASE_HOST?.trim().toLowerCase();
  const expectedDatabase = env.DOLETH_ADMIN_ADOPTION_EXPECTED_DATABASE?.trim();
  if (!expectedHost || !expectedDatabase) throw new AdminAdoptionConfigError("EXPECTED_TARGET_REQUIRED");
  if (target.host !== expectedHost || target.database !== expectedDatabase) {
    throw new AdminAdoptionConfigError("EXPECTED_TARGET_MISMATCH");
  }

  const projectId = required(env, "DOLETH_ADMIN_ADOPTION_PROJECT_ID");
  const branchId = required(env, "DOLETH_ADMIN_ADOPTION_BRANCH_ID");
  const productionProjectId = required(env, "DOLETH_ADMIN_ADOPTION_PRODUCTION_PROJECT_ID");
  const productionBranchId = required(env, "DOLETH_ADMIN_ADOPTION_PRODUCTION_BRANCH_ID");
  const productionHost = required(env, "DOLETH_ADMIN_ADOPTION_PRODUCTION_DATABASE_HOST").toLowerCase();

  if (environment === "production") {
    if (env.DOLETH_ALLOW_PRODUCTION_ADMIN_ADOPTION !== "YES") {
      throw new AdminAdoptionConfigError("PRODUCTION_FLAG_REQUIRED");
    }
    if (projectId !== productionProjectId || branchId !== productionBranchId || target.host !== productionHost) {
      throw new AdminAdoptionConfigError("PRODUCTION_SEPARATION_FAILED");
    }
    const testTarget = env.TEST_DATABASE_URL ? parseTarget(env.TEST_DATABASE_URL) : null;
    if (testTarget && sameTarget(target, testTarget)) {
      throw new AdminAdoptionConfigError("TEST_DATABASE_COLLISION");
    }
  } else if (projectId === productionProjectId || branchId === productionBranchId || target.host === productionHost) {
    throw new AdminAdoptionConfigError("PRODUCTION_SEPARATION_FAILED");
  }

  const actor = env.DOLETH_ADMIN_ADOPTION_ACTOR?.trim() ?? "";
  const reason = env.DOLETH_ADMIN_ADOPTION_REASON?.trim() ?? "";
  const commit = env.DOLETH_ADMIN_ADOPTION_COMMIT?.trim().toLowerCase() ?? "";
  if (!safeAuditValue(actor, 80) || !safeAuditValue(reason, 160) || !/^[0-9a-f]{40}$/.test(commit)) {
    throw new AdminAdoptionConfigError("AUDIT_METADATA_REQUIRED");
  }

  return {
    connectionString,
    database: target.database,
    environment,
    host: target.host,
    metadata: { actor, commit, environment, reason },
  };
}

export function redactAdminAdoptionDatabase(host: string, database: string): string {
  const maskedHost = host.length <= 8 ? `${host.slice(0, 2)}…` : `${host.slice(0, 4)}…${host.slice(-6)}`;
  return `${maskedHost}/${database}`;
}
