import { createHash, randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";

export const ADMIN_ADOPTION_TOOL_VERSION = "1";
export const ADMIN_ADOPTION_TEST_FAULT_AUTHORIZATION = Symbol("admin-adoption-test-fault");

export const ADMIN_ADOPTION_MIGRATIONS = [
  "202607210001_vertical_007",
  "202607220001_investments",
  "202607270001_multiuser_identity",
  "202607280001_require_financial_ownership",
  "202607290001_enforce_cross_owner_relations",
  "202607300001_private_beta_access",
] as const;

export const HISTORICAL_FINANCIAL_COUNTS = {
  accounts: 1,
  categories: 13,
  transactions: 1,
  ledgerEntries: 1,
  investments: 0,
  upcomingPayments: 0,
} as const;

export type AdminAdoptionEnvironment = "rehearsal" | "preview" | "production" | "test";
export type AdminAdoptionResultCode = "READY_TO_ADOPT" | "ADOPTED" | "ALREADY_ADOPTED";

export type AdminAdoptionErrorCode =
  | "EMPTY_DATABASE"
  | "USER_NOT_FOUND_BY_ID"
  | "USER_NOT_FOUND_BY_EMAIL"
  | "ID_EMAIL_MISMATCH"
  | "AMBIGUOUS_CANDIDATE"
  | "UNEXPECTED_USER_COUNT"
  | "ACTIVE_ADMIN_EXISTS"
  | "INCOMPATIBLE_USER_STATE"
  | "EMAIL_ALREADY_VERIFIED"
  | "HISTORICAL_DATA_MISMATCH"
  | "NULL_OWNER"
  | "ORPHAN_OWNER"
  | "CROSS_OWNER"
  | "AUTH_ARTIFACTS_PRESENT"
  | "MIGRATION_STATE_MISMATCH"
  | "CONCURRENT_STATE_CHANGE"
  | "PRESERVATION_CHECK_FAILED"
  | "AUDIT_WRITE_FAILED"
  | "TEST_FAULT_FORBIDDEN";

export class AdminAdoptionError extends Error {
  constructor(readonly code: AdminAdoptionErrorCode) {
    super(code);
    this.name = "AdminAdoptionError";
  }
}

export interface AdoptionUserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  status: string;
  role: string;
  email_verified_at: Date | null;
  private_beta_activated_at: Date | null;
  password_changed_at: Date;
  updated_at: Date;
}

export interface FinancialCounts {
  accounts: number;
  categories: number;
  transactions: number;
  ledgerEntries: number;
  investments: number;
  upcomingPayments: number;
}

export interface AdminAdoptionSnapshot {
  users: number;
  idMatches: number;
  emailMatches: number;
  exactCandidates: number;
  activeAdmins: number;
  candidate: AdoptionUserRow | null;
  targetFinancial: FinancialCounts;
  globalFinancial: FinancialCounts;
  nullOwners: number;
  orphanOwners: number;
  crossOwner: number;
  sessions: number;
  authTokens: number;
  privateBetaInvites: number;
  appliedMigrations: string[];
  failedMigrations: number;
}

export interface AdminAdoptionMetadata {
  actor: string;
  commit: string;
  environment: AdminAdoptionEnvironment;
  reason: string;
}

export interface AdminAdoptionInput {
  dryRun: boolean;
  email: string;
  metadata: AdminAdoptionMetadata;
  pool: Pool;
  userId: string;
  /** Solo lo usan pruebas de rollback sobre bases descartables. El CLI nunca lo expone. */
  testOnlyFault?: "after-user-update" | "before-audit";
  testOnlyFaultAuthorization?: typeof ADMIN_ADOPTION_TEST_FAULT_AUTHORIZATION;
}

export interface AdminAdoptionResult {
  code: AdminAdoptionResultCode;
  summary: ReturnType<typeof safeAdminAdoptionSummary>;
  timestamp: Date | null;
}

interface CountRow {
  total: string;
}

function number(value: string | number | bigint | null | undefined): number {
  return Number(value ?? 0);
}

async function count(client: PoolClient, sql: string, values: unknown[] = []): Promise<number> {
  const result = await client.query<CountRow>(sql, values);
  return number(result.rows[0]?.total);
}

async function financialCounts(client: PoolClient, userId?: string): Promise<FinancialCounts> {
  const where = userId ? ` WHERE "userId" = $1` : "";
  const values = userId ? [userId] : [];
  const result = await client.query<{
    accounts: string;
    categories: string;
    transactions: string;
    ledger_entries: string;
    investments: string;
    upcoming_payments: string;
  }>(
    `SELECT
       (SELECT COUNT(*) FROM "Account"${where})::text AS accounts,
       (SELECT COUNT(*) FROM "Category"${where})::text AS categories,
       (SELECT COUNT(*) FROM "Transaction"${where})::text AS transactions,
       (SELECT COUNT(*) FROM "LedgerEntry"${where})::text AS ledger_entries,
       (SELECT COUNT(*) FROM "Investment"${where})::text AS investments,
       (SELECT COUNT(*) FROM "UpcomingPayment"${where})::text AS upcoming_payments`,
    values,
  );
  const row = result.rows[0];
  return {
    accounts: number(row?.accounts),
    categories: number(row?.categories),
    transactions: number(row?.transactions),
    ledgerEntries: number(row?.ledger_entries),
    investments: number(row?.investments),
    upcomingPayments: number(row?.upcoming_payments),
  };
}

async function ownershipCounts(client: PoolClient): Promise<{
  nullOwners: number;
  orphanOwners: number;
  crossOwner: number;
}> {
  const ownership = await client.query<{ null_owners: string; orphan_owners: string }>(
    `WITH ownership AS (
       SELECT "userId" FROM "Account"
       UNION ALL SELECT "userId" FROM "Category"
       UNION ALL SELECT "userId" FROM "Transaction"
       UNION ALL SELECT "userId" FROM "LedgerEntry"
       UNION ALL SELECT "userId" FROM "Investment"
       UNION ALL SELECT "userId" FROM "UpcomingPayment"
     )
     SELECT
       COUNT(*) FILTER (WHERE o."userId" IS NULL)::text AS null_owners,
       COUNT(*) FILTER (WHERE o."userId" IS NOT NULL AND u.id IS NULL)::text AS orphan_owners
     FROM ownership o
     LEFT JOIN "User" u ON u.id = o."userId"`,
  );

  const crossOwner = await count(
    client,
    `SELECT COALESCE(SUM(total), 0)::text AS total
     FROM (
       SELECT COUNT(*)::bigint AS total FROM "Transaction" t JOIN "Account" a ON a.id = t."sourceAccountId" WHERE t."userId" IS DISTINCT FROM a."userId"
       UNION ALL SELECT COUNT(*)::bigint FROM "Transaction" t JOIN "Account" a ON a.id = t."destinationAccountId" WHERE t."destinationAccountId" IS NOT NULL AND t."userId" IS DISTINCT FROM a."userId"
       UNION ALL SELECT COUNT(*)::bigint FROM "Transaction" t JOIN "Category" c ON c.id = t."categoryId" WHERE t."categoryId" IS NOT NULL AND t."userId" IS DISTINCT FROM c."userId"
       UNION ALL SELECT COUNT(*)::bigint FROM "Transaction" t JOIN "Transaction" original ON original.id = t."correctedFromId" WHERE t."correctedFromId" IS NOT NULL AND t."userId" IS DISTINCT FROM original."userId"
       UNION ALL SELECT COUNT(*)::bigint FROM "LedgerEntry" le JOIN "Account" a ON a.id = le."accountId" WHERE le."userId" IS DISTINCT FROM a."userId"
       UNION ALL SELECT COUNT(*)::bigint FROM "LedgerEntry" le JOIN "Transaction" t ON t.id = le."transactionId" WHERE le."userId" IS DISTINCT FROM t."userId"
       UNION ALL SELECT COUNT(*)::bigint FROM "UpcomingPayment" up JOIN "Account" a ON a.id = up."plannedAccountId" WHERE up."userId" IS DISTINCT FROM a."userId"
       UNION ALL SELECT COUNT(*)::bigint FROM "UpcomingPayment" up JOIN "Transaction" t ON t.id = up."transactionId" WHERE up."transactionId" IS NOT NULL AND up."userId" IS DISTINCT FROM t."userId"
     ) checks`,
  );

  return {
    nullOwners: number(ownership.rows[0]?.null_owners),
    orphanOwners: number(ownership.rows[0]?.orphan_owners),
    crossOwner,
  };
}

export async function readAdminAdoptionSnapshot(
  client: PoolClient,
  input: { email: string; userId: string },
): Promise<AdminAdoptionSnapshot> {
  const [userCount, activeAdmins, candidates, targetFinancial, globalFinancial, ownership, artifacts, migrations] =
    await Promise.all([
      count(client, `SELECT COUNT(*)::text AS total FROM "User"`),
      count(
        client,
        `SELECT COUNT(*)::text AS total FROM "User" WHERE role = 'ADMIN' AND status = 'ACTIVE'`,
      ),
      client.query<AdoptionUserRow>(
        `SELECT id, email, name, "passwordHash" AS password_hash, status::text, role::text,
                "emailVerifiedAt" AS email_verified_at,
                "privateBetaActivatedAt" AS private_beta_activated_at,
                "passwordChangedAt" AS password_changed_at,
                "updatedAt" AS updated_at
         FROM "User"
         WHERE id = $1 OR email = $2
         ORDER BY id`,
        [input.userId, input.email],
      ),
      financialCounts(client, input.userId),
      financialCounts(client),
      ownershipCounts(client),
      client.query<{ sessions: string; auth_tokens: string; private_beta_invites: string }>(
        `SELECT
           (SELECT COUNT(*) FROM "Session")::text AS sessions,
           (SELECT COUNT(*) FROM "AuthToken")::text AS auth_tokens,
           (SELECT COUNT(*) FROM "PrivateBetaInvite")::text AS private_beta_invites`,
      ),
      client.query<{ migration_name: string; failed: string }>(
        `SELECT migration_name, '0'::text AS failed
         FROM "_prisma_migrations"
         WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
         UNION ALL
         SELECT '__FAILED__', COUNT(*)::text
         FROM "_prisma_migrations"
         WHERE finished_at IS NULL AND rolled_back_at IS NULL
         ORDER BY migration_name`,
      ),
    ]);

  const exact = candidates.rows.filter((row) => row.id === input.userId && row.email === input.email);
  const artifactRow = artifacts.rows[0];
  const failedRow = migrations.rows.find((row) => row.migration_name === "__FAILED__");
  return {
    users: userCount,
    idMatches: candidates.rows.filter((row) => row.id === input.userId).length,
    emailMatches: candidates.rows.filter((row) => row.email === input.email).length,
    exactCandidates: exact.length,
    activeAdmins,
    candidate: exact[0] ?? null,
    targetFinancial,
    globalFinancial,
    ...ownership,
    sessions: number(artifactRow?.sessions),
    authTokens: number(artifactRow?.auth_tokens),
    privateBetaInvites: number(artifactRow?.private_beta_invites),
    appliedMigrations: migrations.rows
      .filter((row) => row.migration_name !== "__FAILED__")
      .map((row) => row.migration_name),
    failedMigrations: number(failedRow?.failed),
  };
}

function countsMatch(actual: FinancialCounts, expected: FinancialCounts): boolean {
  return (Object.keys(expected) as (keyof FinancialCounts)[]).every((key) => actual[key] === expected[key]);
}

export function validateAdminAdoptionSnapshot(snapshot: AdminAdoptionSnapshot): "READY_TO_ADOPT" | "ALREADY_ADOPTED" {
  if (snapshot.users === 0) throw new AdminAdoptionError("EMPTY_DATABASE");
  if (snapshot.idMatches === 0) throw new AdminAdoptionError("USER_NOT_FOUND_BY_ID");
  if (snapshot.emailMatches === 0) throw new AdminAdoptionError("USER_NOT_FOUND_BY_EMAIL");
  if (snapshot.exactCandidates === 0) throw new AdminAdoptionError("ID_EMAIL_MISMATCH");
  if (snapshot.exactCandidates !== 1) throw new AdminAdoptionError("AMBIGUOUS_CANDIDATE");
  if (snapshot.users !== 1) throw new AdminAdoptionError("UNEXPECTED_USER_COUNT");
  if (!snapshot.candidate) throw new AdminAdoptionError("ID_EMAIL_MISMATCH");
  if (snapshot.failedMigrations !== 0 || JSON.stringify(snapshot.appliedMigrations) !== JSON.stringify(ADMIN_ADOPTION_MIGRATIONS)) {
    throw new AdminAdoptionError("MIGRATION_STATE_MISMATCH");
  }
  if (snapshot.candidate.email_verified_at !== null) throw new AdminAdoptionError("EMAIL_ALREADY_VERIFIED");
  if (snapshot.nullOwners !== 0) throw new AdminAdoptionError("NULL_OWNER");
  if (snapshot.orphanOwners !== 0) throw new AdminAdoptionError("ORPHAN_OWNER");
  if (snapshot.crossOwner !== 0) throw new AdminAdoptionError("CROSS_OWNER");
  if (
    !countsMatch(snapshot.targetFinancial, HISTORICAL_FINANCIAL_COUNTS) ||
    !countsMatch(snapshot.globalFinancial, HISTORICAL_FINANCIAL_COUNTS)
  ) {
    throw new AdminAdoptionError("HISTORICAL_DATA_MISMATCH");
  }
  if (snapshot.sessions !== 0 || snapshot.authTokens !== 0 || snapshot.privateBetaInvites !== 0) {
    throw new AdminAdoptionError("AUTH_ARTIFACTS_PRESENT");
  }

  const adopted =
    snapshot.candidate.status === "ACTIVE" &&
    snapshot.candidate.role === "ADMIN" &&
    snapshot.candidate.private_beta_activated_at !== null;
  if (adopted) {
    if (snapshot.activeAdmins !== 1) throw new AdminAdoptionError("ACTIVE_ADMIN_EXISTS");
    return "ALREADY_ADOPTED";
  }
  if (snapshot.activeAdmins !== 0) throw new AdminAdoptionError("ACTIVE_ADMIN_EXISTS");
  if (
    snapshot.candidate.status !== "PENDING_VERIFICATION" ||
    snapshot.candidate.role !== "USER" ||
    snapshot.candidate.private_beta_activated_at !== null
  ) {
    throw new AdminAdoptionError("INCOMPATIBLE_USER_STATE");
  }
  return "READY_TO_ADOPT";
}

export function redactAdminAdoptionId(id: string): string {
  if (id.length <= 8) return `${id.slice(0, 2)}…${id.slice(-2)}`;
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

export function maskAdminAdoptionEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  const [domainName = "", ...suffix] = domain.split(".");
  return `${local.slice(0, 1) || "*"}***@${domainName.slice(0, 1) || "*"}***${suffix.length ? `.${suffix.join(".")}` : ""}`;
}

export function adminAdoptionConfirmationPhrase(environment: AdminAdoptionEnvironment, userId: string, email: string): string {
  const code = createHash("sha256").update(`${environment}:${userId}:${email}`).digest("hex").slice(0, 8).toUpperCase();
  return `ADOPT ${redactAdminAdoptionId(userId)} ${code} AS PRIVATE BETA ADMIN`;
}

export function safeAdminAdoptionSummary(snapshot: AdminAdoptionSnapshot, environment: AdminAdoptionEnvironment) {
  return {
    userFound: snapshot.exactCandidates === 1,
    email: snapshot.candidate ? maskAdminAdoptionEmail(snapshot.candidate.email) : "<not-found>",
    userId: snapshot.candidate ? redactAdminAdoptionId(snapshot.candidate.id) : "<not-found>",
    status: snapshot.candidate?.status ?? "NOT_FOUND",
    role: snapshot.candidate?.role ?? "NOT_FOUND",
    emailVerified: snapshot.candidate?.email_verified_at !== null,
    ...snapshot.targetFinancial,
    activeAdmins: snapshot.activeAdmins,
    environment,
    migrations: snapshot.appliedMigrations.length,
    sessions: snapshot.sessions,
    authTokens: snapshot.authTokens,
    privateBetaInvites: snapshot.privateBetaInvites,
  };
}

function preservedUserFingerprint(user: AdoptionUserRow): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        passwordHash: user.password_hash,
        emailVerifiedAt: user.email_verified_at?.toISOString() ?? null,
        passwordChangedAt: user.password_changed_at.toISOString(),
        updatedAt: user.updated_at.toISOString(),
      }),
    )
    .digest("hex");
}

function auditContext(input: AdminAdoptionInput, before: AdoptionUserRow, timestamp: Date): string {
  return JSON.stringify({
    event: "PRIVATE_BETA_ADMIN_ADOPTED",
    actor: input.metadata.actor,
    target: redactAdminAdoptionId(input.userId),
    timestamp: timestamp.toISOString(),
    environment: input.metadata.environment,
    toolVersion: ADMIN_ADOPTION_TOOL_VERSION,
    commit: input.metadata.commit,
    before: { status: before.status, role: before.role, privateBetaActivated: false, emailVerified: false },
    after: { status: "ACTIVE", role: "ADMIN", privateBetaActivated: true, emailVerified: false },
    reason: input.metadata.reason,
    result: "ADOPTED",
  });
}

export async function runAdminAdoption(input: AdminAdoptionInput): Promise<AdminAdoptionResult> {
  if (
    input.testOnlyFault &&
    (input.metadata.environment === "production" ||
      input.testOnlyFaultAuthorization !== ADMIN_ADOPTION_TEST_FAULT_AUTHORIZATION)
  ) {
    throw new AdminAdoptionError("TEST_FAULT_FORBIDDEN");
  }

  const client = await input.pool.connect();
  let transaction = false;
  try {
    await client.query(input.dryRun ? "BEGIN ISOLATION LEVEL SERIALIZABLE READ ONLY" : "BEGIN ISOLATION LEVEL SERIALIZABLE");
    transaction = true;
    await client.query("SET LOCAL statement_timeout = '5s'");
    await client.query("SET LOCAL lock_timeout = '2s'");
    if (!input.dryRun) {
      await client.query(`SELECT pg_advisory_xact_lock(hashtext($1::text))::text`, ["doleth-private-beta-admin-adoption"]);
      await client.query(`SELECT id FROM "User" WHERE id = $1 AND email = $2 FOR UPDATE`, [input.userId, input.email]);
    }

    const before = await readAdminAdoptionSnapshot(client, input);
    const state = validateAdminAdoptionSnapshot(before);
    const summary = safeAdminAdoptionSummary(before, input.metadata.environment);

    if (state === "ALREADY_ADOPTED") {
      await client.query("ROLLBACK");
      transaction = false;
      return { code: "ALREADY_ADOPTED", summary, timestamp: before.candidate?.private_beta_activated_at ?? null };
    }
    if (input.dryRun) {
      await client.query("ROLLBACK");
      transaction = false;
      return { code: "READY_TO_ADOPT", summary, timestamp: null };
    }
    if (!before.candidate) throw new AdminAdoptionError("CONCURRENT_STATE_CHANGE");

    const preservedBefore = preservedUserFingerprint(before.candidate);
    const timestamp = new Date();
    const updated = await client.query<{ id: string }>(
      `UPDATE "User"
       SET role = 'ADMIN', status = 'ACTIVE', "privateBetaActivatedAt" = $3
       WHERE id = $1 AND email = $2
         AND role = 'USER' AND status = 'PENDING_VERIFICATION'
         AND "privateBetaActivatedAt" IS NULL AND "emailVerifiedAt" IS NULL
       RETURNING id`,
      [input.userId, input.email, timestamp],
    );
    if (updated.rowCount !== 1) throw new AdminAdoptionError("CONCURRENT_STATE_CHANGE");
    if (input.testOnlyFault === "after-user-update") throw new Error("TEST_FAULT_AFTER_USER_UPDATE");
    if (input.testOnlyFault === "before-audit") throw new AdminAdoptionError("AUDIT_WRITE_FAILED");

    const audit = await client.query(
      `INSERT INTO "AuthEvent" (id, "userId", type, success, context, "createdAt")
       VALUES ($1, $2, 'PRIVATE_BETA_ADMIN_BOOTSTRAPPED', true, $3, $4)`,
      [randomUUID(), input.userId, auditContext(input, before.candidate, timestamp), timestamp],
    );
    if (audit.rowCount !== 1) throw new AdminAdoptionError("AUDIT_WRITE_FAILED");

    const after = await readAdminAdoptionSnapshot(client, input);
    if (validateAdminAdoptionSnapshot(after) !== "ALREADY_ADOPTED" || !after.candidate) {
      throw new AdminAdoptionError("CONCURRENT_STATE_CHANGE");
    }
    if (preservedUserFingerprint(after.candidate) !== preservedBefore) {
      throw new AdminAdoptionError("PRESERVATION_CHECK_FAILED");
    }
    await client.query("COMMIT");
    transaction = false;
    return { code: "ADOPTED", summary: safeAdminAdoptionSummary(after, input.metadata.environment), timestamp };
  } catch (error) {
    if (transaction) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // El error original conserva prioridad; el pool descarta conexiones rotas.
      }
    }
    throw error;
  } finally {
    client.release();
  }
}
