import { randomUUID } from "node:crypto";
import { Pool, type PoolClient } from "pg";
import { resolveTestDatabaseUrl } from "../../src/test/database-url";

/**
 * Fixture legacy para rehearsal. Nunca acepta DATABASE_URL como fuente.
 *
 * Requiere un TEST_DATABASE_URL cuyo nombre declare test/ci/rehearsal y un
 * esquema detenido en la migración expand (userId todavía nullable).
 */

type Scenario = "valid" | "cross-owner";

function argument(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

async function assertExpandState(client: PoolClient): Promise<void> {
  const migrations = await client.query<{ migration_name: string }>(
    `SELECT migration_name
     FROM _prisma_migrations
     WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
     ORDER BY migration_name`,
  );
  const names = migrations.rows.map((row) => row.migration_name);
  const expected = [
    "202607210001_vertical_007",
    "202607220001_investments",
    "202607270001_multiuser_identity",
  ];
  if (JSON.stringify(names) !== JSON.stringify(expected)) {
    throw new Error(`El fixture exige exactamente el estado expand; encontró ${names.length} migraciones aplicadas.`);
  }

  const ownership = await client.query<{ nullable: string; total: string }>(
    `SELECT COUNT(*) FILTER (WHERE is_nullable = 'YES')::text AS nullable,
            COUNT(*)::text AS total
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND column_name = 'userId'
       AND table_name = ANY($1::text[])`,
    [["Account", "Category", "Transaction", "LedgerEntry", "Investment", "UpcomingPayment"]],
  );
  if (ownership.rows[0]?.nullable !== "6" || ownership.rows[0]?.total !== "6") {
    throw new Error("El fixture exige las seis columnas financieras userId todavía nullable.");
  }

  const existing = await client.query<{ total: string }>(
    `SELECT (
       (SELECT COUNT(*) FROM "User") +
       (SELECT COUNT(*) FROM "Account") +
       (SELECT COUNT(*) FROM "Transaction")
     )::text AS total`,
  );
  if (existing.rows[0]?.total !== "0") {
    throw new Error("La base de rehearsal no está vacía. No se agregaron fixtures.");
  }
}

async function seedValid(client: PoolClient): Promise<void> {
  const now = new Date("2026-07-29T12:00:00.000Z");
  const ownerId = `legacy-owner-${randomUUID()}`;
  const accountId = `legacy-account-${randomUUID()}`;
  const categoryId = `legacy-category-${randomUUID()}`;
  const transactionId = `legacy-transaction-${randomUUID()}`;

  await client.query(
    `INSERT INTO "User"
       (id, name, email, "passwordHash", status, "emailVerifiedAt", "updatedAt")
     VALUES ($1, 'Legacy owner', 'legacy-owner@rehearsal.invalid',
       'scrypt$65536$8$2$c2FsdGVzdA$aGFzaGRlcHJ1ZWJhbm9zaXJ2ZXBhcmFuYWRhMDA',
       'ACTIVE', $2, $2)`,
    [ownerId, now],
  );
  await client.query(
    `INSERT INTO "Account"
       (id, name, type, "initialBalanceCents", "createdAt", "updatedAt")
     VALUES ($1, 'Cuenta legacy', 'BANK', 100000, $2, $2)`,
    [accountId, now],
  );
  await client.query(
    `INSERT INTO "Category" (id, slug, name, kind, "createdAt", "updatedAt")
     VALUES ($1, 'legacy-expense', 'Legacy expense', 'EXPENSE', $2, $2)`,
    [categoryId, now],
  );
  await client.query(
    `INSERT INTO "Transaction"
       (id, type, "amountCents", "occurredOn", description, "sourceAccountId",
        "categoryId", "idempotencyKey", "createdAt", "updatedAt")
     VALUES ($1, 'EXPENSE', 12345, DATE '2026-07-10', 'Gasto legacy', $2, $3,
       'legacy-valid-transaction', $4, $4)`,
    [transactionId, accountId, categoryId, now],
  );
  await client.query(
    `INSERT INTO "LedgerEntry" (id, "transactionId", "accountId", "amountCents", "createdAt")
     VALUES ($1, $2, $3, -12345, $4)`,
    [`legacy-entry-${randomUUID()}`, transactionId, accountId, now],
  );
  await client.query(
    `INSERT INTO "UpcomingPayment"
       (id, concept, "estimatedCents", "dueOn", "plannedAccountId", "createdAt", "updatedAt")
     VALUES ($1, 'Servicio legacy', 25000, DATE '2026-08-10', $2, $3, $3)`,
    [`legacy-upcoming-${randomUUID()}`, accountId, now],
  );
  await client.query(
    `INSERT INTO "Investment"
       (id, name, kind, "investedCents", "currentValueCents", "createdAt", "updatedAt")
     VALUES ($1, 'Inversión legacy', 'FUND', 50000, 55000, $2, $2)`,
    [`legacy-investment-${randomUUID()}`, now],
  );
}

async function seedCrossOwner(client: PoolClient): Promise<void> {
  const now = new Date("2026-07-29T12:00:00.000Z");
  const ownerA = `cross-owner-a-${randomUUID()}`;
  const ownerB = `cross-owner-b-${randomUUID()}`;
  const accountA = `cross-account-a-${randomUUID()}`;
  const accountB = `cross-account-b-${randomUUID()}`;
  const categoryA = `cross-category-a-${randomUUID()}`;
  const transactionId = `cross-transaction-${randomUUID()}`;

  for (const [id, email] of [
    [ownerA, "cross-owner-a@rehearsal.invalid"],
    [ownerB, "cross-owner-b@rehearsal.invalid"],
  ]) {
    await client.query(
      `INSERT INTO "User"
         (id, name, email, "passwordHash", status, "emailVerifiedAt", "updatedAt")
       VALUES ($1, 'Cross owner', $2,
         'scrypt$65536$8$2$c2FsdGVzdA$aGFzaGRlcHJ1ZWJhbm9zaXJ2ZXBhcmFuYWRhMDA',
         'ACTIVE', $3, $3)`,
      [id, email, now],
    );
  }
  for (const [id, name, userId] of [
    [accountA, "Cuenta A", ownerA],
    [accountB, "Cuenta B", ownerB],
  ]) {
    await client.query(
      `INSERT INTO "Account"
         (id, "userId", name, type, "initialBalanceCents", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, 'BANK', 100000, $4, $4)`,
      [id, userId, name, now],
    );
  }
  await client.query(
    `INSERT INTO "Category" (id, "userId", slug, name, kind, "createdAt", "updatedAt")
     VALUES ($1, $2, 'cross-expense', 'Cross expense', 'EXPENSE', $3, $3)`,
    [categoryA, ownerA, now],
  );
  await client.query(
    `INSERT INTO "Transaction"
       (id, "userId", type, "amountCents", "occurredOn", "sourceAccountId",
        "categoryId", "idempotencyKey", "createdAt", "updatedAt")
     VALUES ($1, $2, 'EXPENSE', 1000, DATE '2026-07-10', $3, $4,
       'cross-owner-transaction', $5, $5)`,
    [transactionId, ownerA, accountB, categoryA, now],
  );
  await client.query(
    `INSERT INTO "LedgerEntry"
       (id, "userId", "transactionId", "accountId", "amountCents", "createdAt")
     VALUES ($1, $2, $3, $4, -1000, $5)`,
    [`cross-entry-${randomUUID()}`, ownerA, transactionId, accountB, now],
  );
  await client.query(
    `INSERT INTO "UpcomingPayment"
       (id, "userId", concept, "estimatedCents", "dueOn", "plannedAccountId",
        "createdAt", "updatedAt")
     VALUES ($1, $2, 'Cross upcoming', 5000, DATE '2026-08-10', $3, $4, $4)`,
    [`cross-upcoming-${randomUUID()}`, ownerA, accountB, now],
  );
}

async function main(): Promise<void> {
  const scenario = argument("scenario") as Scenario | undefined;
  if (scenario !== "valid" && scenario !== "cross-owner") {
    throw new Error("Usá --scenario=valid o --scenario=cross-owner.");
  }

  const connectionString = resolveTestDatabaseUrl({
    TEST_DATABASE_URL: process.env.TEST_DATABASE_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    DOLETH_REQUIRE_DB: "1",
  });
  if (!connectionString) throw new Error("TEST_DATABASE_URL es obligatoria.");

  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await assertExpandState(client);
    if (scenario === "valid") await seedValid(client);
    else await seedCrossOwner(client);
    await client.query("COMMIT");
    console.info(`Fixture legacy ${scenario} creado en base descartable.`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(`Fixture abortado: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
