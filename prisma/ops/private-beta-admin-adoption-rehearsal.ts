import { createHash } from "node:crypto";
import { Pool, type PoolClient } from "pg";
import {
  ADMIN_ADOPTION_MIGRATIONS,
  ADMIN_ADOPTION_TEST_FAULT_AUTHORIZATION,
  AdminAdoptionError,
  readAdminAdoptionSnapshot,
  runAdminAdoption,
  validateAdminAdoptionSnapshot,
} from "./lib/private-beta-admin-adoption";
import { DEFAULT_CATEGORIES } from "../../src/lib/finance/categories";
import { resolveTestDatabaseUrl } from "../../src/test/database-url";

const SYNTHETIC_USER_ID = "rehearsal-private-beta-admin";
const SYNTHETIC_EMAIL = "historical-admin@rehearsal.invalid";
const TABLES = [
  "User",
  "Session",
  "AuthToken",
  "AuthEvent",
  "PrivateBetaInvite",
  "Account",
  "Category",
  "Transaction",
  "LedgerEntry",
  "Investment",
  "UpcomingPayment",
] as const;
const FINANCIAL_TABLES = ["Account", "Category", "Transaction", "LedgerEntry", "Investment", "UpcomingPayment"] as const;

function assert(condition: unknown, code: string): asserts condition {
  if (!condition) throw new Error(code);
}

async function readStdin(): Promise<string> {
  let value = "";
  for await (const chunk of process.stdin) value += String(chunk);
  return value.trim();
}

async function digest(client: PoolClient, tables: readonly string[]): Promise<string> {
  const hash = createHash("sha256");
  for (const table of tables) {
    const rows = await client.query<{ row: string }>(
      `SELECT row_to_json(ordered)::text AS row FROM (SELECT * FROM "${table}" ORDER BY id) ordered`,
    );
    hash.update(table);
    for (const row of rows.rows) hash.update(row.row);
  }
  return hash.digest("hex");
}

async function seed(client: PoolClient): Promise<void> {
  const migrations = await client.query<{ migration_name: string }>(
    `SELECT migration_name FROM "_prisma_migrations"
     WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY migration_name`,
  );
  assert(JSON.stringify(migrations.rows.map((row) => row.migration_name)) === JSON.stringify(ADMIN_ADOPTION_MIGRATIONS), "MIGRATIONS_NOT_6_OF_6");
  const existing = await client.query<{ total: string }>(
    `SELECT ((SELECT COUNT(*) FROM "User") + (SELECT COUNT(*) FROM "Account") + (SELECT COUNT(*) FROM "AuthEvent"))::text AS total`,
  );
  assert(existing.rows[0]?.total === "0", "REHEARSAL_DATABASE_NOT_EMPTY");

  const now = new Date("2026-08-01T12:00:00.000Z");
  await client.query("BEGIN");
  try {
    await client.query(
      `INSERT INTO "User" (id, name, email, "passwordHash", status, role, "emailVerifiedAt", "updatedAt")
       VALUES ($1, 'Synthetic historical administrator', $2,
         'scrypt$65536$8$2$c2FsdGVzdA$aGFzaGRlcHJ1ZWJhbm9zaXJ2ZXBhcmFuYWRhMDA',
         'PENDING_VERIFICATION', 'USER', NULL, $3)`,
      [SYNTHETIC_USER_ID, SYNTHETIC_EMAIL, now],
    );
    for (const [index, category] of DEFAULT_CATEGORIES.entries()) {
      await client.query(
        `INSERT INTO "Category" (id, "userId", slug, name, kind, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $6)`,
        [`rehearsal-category-${index + 1}`, SYNTHETIC_USER_ID, category.slug, category.name, category.kind, now],
      );
    }
    await client.query(
      `INSERT INTO "Account" (id, "userId", name, type, "initialBalanceCents", "createdAt", "updatedAt")
       VALUES ('rehearsal-account', $1, 'Synthetic historical account', 'BANK', 100000, $2, $2)`,
      [SYNTHETIC_USER_ID, now],
    );
    await client.query(
      `INSERT INTO "Transaction"
        (id, "userId", type, "amountCents", "occurredOn", description, "sourceAccountId", "categoryId",
         "idempotencyKey", "voidedAt", "voidReason", "createdAt", "updatedAt")
       VALUES ('rehearsal-transaction', $1, 'EXPENSE', 1000, DATE '2026-07-10', 'Synthetic historical expense',
         'rehearsal-account', 'rehearsal-category-5', 'rehearsal-historical-expense', $2, 'historical reversal', $2, $2)`,
      [SYNTHETIC_USER_ID, now],
    );
    await client.query(
      `INSERT INTO "LedgerEntry" (id, "userId", "transactionId", "accountId", "amountCents", "createdAt")
       VALUES ('rehearsal-ledger', $1, 'rehearsal-transaction', 'rehearsal-account', -1000, $2)`,
      [SYNTHETIC_USER_ID, now],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function expectRollback(
  pool: Pool,
  baseline: string,
  fault: "after-user-update" | "before-audit",
): Promise<void> {
  let failed = false;
  try {
    await runAdminAdoption({
      dryRun: false,
      email: SYNTHETIC_EMAIL,
      metadata: {
        actor: "rehearsal-cli",
        commit: process.env.DOLETH_ADMIN_ADOPTION_COMMIT ?? "",
        environment: "rehearsal",
        reason: "atomic rollback rehearsal",
      },
      pool,
      testOnlyFault: fault,
      testOnlyFaultAuthorization: ADMIN_ADOPTION_TEST_FAULT_AUTHORIZATION,
      userId: SYNTHETIC_USER_ID,
    });
  } catch (error) {
    failed = fault === "before-audit" ? error instanceof AdminAdoptionError : error instanceof Error;
  }
  assert(failed, `FAULT_${fault}_DID_NOT_ABORT`);
  const client = await pool.connect();
  try {
    assert((await digest(client, TABLES)) === baseline, `FAULT_${fault}_LEFT_WRITES`);
  } finally {
    client.release();
  }
}

async function main(): Promise<void> {
  const stdinMode = process.argv.includes("--database-url-stdin");
  const connectionString = stdinMode
    ? await readStdin()
    : resolveTestDatabaseUrl({
        TEST_DATABASE_URL: process.env.TEST_DATABASE_URL,
        DATABASE_URL: process.env.DATABASE_URL,
        DOLETH_REQUIRE_DB: "1",
      });
  if (!connectionString) throw new Error("TEST_DATABASE_URL_REQUIRED");
  if (stdinMode) {
    const parsed = new URL(connectionString);
    assert(parsed.pathname === "/doleth_admin_adoption_rehearsal", "STDIN_DATABASE_NOT_REHEARSAL");
  }
  const commit = process.argv.find((value) => value.startsWith("--commit="))?.slice("--commit=".length) ?? process.env.DOLETH_ADMIN_ADOPTION_COMMIT ?? "";
  assert(/^[0-9a-f]{40}$/.test(commit), "COMMIT_REQUIRED");

  const pool = new Pool({ connectionString, application_name: "doleth_admin_adoption_rehearsal", max: 2 });
  const client = await pool.connect();
  try {
    await seed(client);
  } finally {
    client.release();
  }

  const baselineClient = await pool.connect();
  let baseline: string;
  let financialBaseline: string;
  try {
    baseline = await digest(baselineClient, TABLES);
    financialBaseline = await digest(baselineClient, FINANCIAL_TABLES);
  } finally {
    baselineClient.release();
  }

  const input = {
    email: SYNTHETIC_EMAIL,
    metadata: {
      actor: "rehearsal-cli",
      commit,
      environment: "rehearsal" as const,
      reason: "private beta admin adoption rehearsal",
    },
    pool,
    userId: SYNTHETIC_USER_ID,
  };
  const dryOne = await runAdminAdoption({ ...input, dryRun: true });
  const dryTwo = await runAdminAdoption({ ...input, dryRun: true });
  assert(dryOne.code === "READY_TO_ADOPT" && dryTwo.code === "READY_TO_ADOPT", "DRY_RUN_NOT_READY");
  const afterDryClient = await pool.connect();
  try {
    assert((await digest(afterDryClient, TABLES)) === baseline, "DRY_RUN_WROTE_DATA");
  } finally {
    afterDryClient.release();
  }

  await expectRollback(pool, baseline, "before-audit");
  await expectRollback(pool, baseline, "after-user-update");

  const adopted = await runAdminAdoption({ ...input, dryRun: false });
  assert(adopted.code === "ADOPTED" && adopted.timestamp, "ADOPTION_FAILED");
  const idempotent = await runAdminAdoption({ ...input, dryRun: false });
  assert(idempotent.code === "ALREADY_ADOPTED", "SECOND_RUN_NOT_IDEMPOTENT");
  assert(idempotent.timestamp?.getTime() === adopted.timestamp.getTime(), "IDEMPOTENT_TIMESTAMP_CHANGED");

  const postClient = await pool.connect();
  try {
    const snapshot = await readAdminAdoptionSnapshot(postClient, input);
    assert(validateAdminAdoptionSnapshot(snapshot) === "ALREADY_ADOPTED", "POSTFLIGHT_NOT_ADOPTED");
    assert(snapshot.candidate?.email_verified_at === null, "EMAIL_WAS_VERIFIED");
    assert((await digest(postClient, FINANCIAL_TABLES)) === financialBaseline, "FINANCIAL_DATA_CHANGED");
    const audit = await postClient.query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM "AuthEvent"
       WHERE "userId" = $1
         AND type = 'PRIVATE_BETA_ADMIN_BOOTSTRAPPED'
         AND context::jsonb ->> 'event' = 'PRIVATE_BETA_ADMIN_ADOPTED'`,
      [SYNTHETIC_USER_ID],
    );
    assert(audit.rows[0]?.total === "1", "AUDIT_EVENT_NOT_EXACTLY_ONCE");
    const activeBalance = await postClient.query<{ match: boolean }>(
      `SELECT COALESCE(SUM(le."amountCents") FILTER (WHERE t."voidedAt" IS NULL), 0) = 0 AS match
       FROM "LedgerEntry" le JOIN "Transaction" t ON t.id = le."transactionId"`,
    );
    assert(activeBalance.rows[0]?.match === true, "BALANCE_MISMATCH");
    const afterFirst = await digest(postClient, TABLES);
    const third = await runAdminAdoption({ ...input, dryRun: false });
    assert(third.code === "ALREADY_ADOPTED", "THIRD_RUN_NOT_IDEMPOTENT");
    assert((await digest(postClient, TABLES)) === afterFirst, "IDEMPOTENT_RUN_WROTE_DATA");
  } finally {
    postClient.release();
    await pool.end();
  }

  console.info(
    `DOLETH_ADMIN_ADOPTION_REHEARSAL=${JSON.stringify({
      migrations: 6,
      dryRuns: 2,
      adoption: "ADOPTED",
      idempotentRuns: 2,
      auditEvents: 1,
      emailVerified: false,
      sessions: 0,
      authTokens: 0,
      invitations: 0,
      financialCounts: { accounts: 1, categories: 13, transactions: 1, ledgerEntries: 1 },
      balances: "MATCH",
      rollbackFaults: 2,
    })}`,
  );
}

main().catch((error: unknown) => {
  console.error(`DOLETH_ADMIN_ADOPTION_REHEARSAL_FAILED=${error instanceof Error ? error.message : "SAFE_ABORT"}`);
  process.exitCode = 1;
});
