import { createHash, randomUUID } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { Pool, type PoolClient } from "pg";

const FINANCIAL_TABLES = [
  "Account",
  "Category",
  "Transaction",
  "LedgerEntry",
  "Investment",
  "UpcomingPayment",
] as const;

const KNOWN_TABLES = [
  "User",
  "Session",
  "AuthToken",
  "AuthEvent",
  "RateLimitCounter",
  "OwnerBackfillRun",
  ...FINANCIAL_TABLES,
] as const;

const EXPECTED_OWNERSHIP_INDEXES = [
  "Account_id_userId_key",
  "Account_userId_status_idx",
  "AuthEvent_userId_createdAt_idx",
  "AuthToken_userId_purpose_idx",
  "Category_id_userId_key",
  "Category_userId_kind_idx",
  "Category_userId_slug_key",
  "Investment_userId_status_idx",
  "LedgerEntry_userId_accountId_idx",
  "Session_userId_idx",
  "Transaction_correctedFromId_userId_key",
  "Transaction_id_userId_key",
  "Transaction_userId_idempotencyKey_key",
  "Transaction_userId_occurredOn_idx",
  "Transaction_userId_type_occurredOn_idx",
  "UpcomingPayment_transactionId_userId_key",
  "UpcomingPayment_userId_status_dueOn_idx",
] as const;

const EXPECTED_OWNERSHIP_FKS = [
  "Account_userId_fkey",
  "AuthEvent_userId_fkey",
  "AuthToken_userId_fkey",
  "Category_userId_fkey",
  "Investment_userId_fkey",
  "LedgerEntry_accountId_userId_fkey",
  "LedgerEntry_transactionId_userId_fkey",
  "LedgerEntry_userId_fkey",
  "Session_userId_fkey",
  "Transaction_categoryId_userId_fkey",
  "Transaction_correctedFromId_userId_fkey",
  "Transaction_destinationAccountId_userId_fkey",
  "Transaction_sourceAccountId_userId_fkey",
  "Transaction_userId_fkey",
  "UpcomingPayment_plannedAccountId_userId_fkey",
  "UpcomingPayment_transactionId_userId_fkey",
  "UpcomingPayment_userId_fkey",
] as const;

const MONEY_COLUMNS = [
  ["Account", "initialBalanceCents"],
  ["Transaction", "amountCents"],
  ["LedgerEntry", "amountCents"],
  ["Investment", "investedCents"],
  ["Investment", "currentValueCents"],
  ["UpcomingPayment", "estimatedCents"],
] as const;

type MigrationState =
  | "APPLIED_MATCHING"
  | "APPLIED_CHECKSUM_MISMATCH"
  | "PENDING"
  | "FAILED"
  | "ROLLED_BACK"
  | "DATABASE_ONLY";

interface LocalMigration {
  name: string;
  checksum: string;
}

interface DatabaseMigration {
  migration_name: string;
  checksum: string;
  started_at: Date;
  finished_at: Date | null;
  rolled_back_at: Date | null;
  applied_steps_count: number;
  logs_present: boolean;
}

interface MigrationReport extends LocalMigration {
  database: boolean;
  startedAt: string | null;
  finishedAt: string | null;
  rolledBackAt: string | null;
  databaseChecksum: string | null;
  logsPresent: boolean;
  state: MigrationState;
}

interface TableReport {
  table: string;
  exists: boolean;
  rows: number;
  owners: number | null;
  nullOwners: number | null;
  orphanOwners: number | null;
  duplicateIds: number | null;
  crossOwner: number;
  state: "MATCH" | "MISMATCH" | "NOT_APPLICABLE";
}

interface CountRow {
  total: string;
}

let currentStage = "startup";

function number(value: string | number | bigint | null | undefined): number {
  return Number(value ?? 0);
}

function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

export function mask(value: string): string {
  if (!value) return "<none>";
  if (value.length <= 4) return `${value.slice(0, 1)}…`;
  return `${value.slice(0, 2)}…${value.slice(-2)}`;
}

export function classifyMigration(local: LocalMigration, rows: DatabaseMigration[]): MigrationState {
  const sameName = rows.filter((row) => row.migration_name === local.name);
  const applied = sameName.find((row) => row.finished_at && !row.rolled_back_at);
  if (applied) return applied.checksum === local.checksum ? "APPLIED_MATCHING" : "APPLIED_CHECKSUM_MISMATCH";
  if (sameName.some((row) => !row.finished_at && !row.rolled_back_at)) return "FAILED";
  if (sameName.some((row) => row.rolled_back_at)) return "ROLLED_BACK";
  return "PENDING";
}

function localMigrations(): LocalMigration[] {
  const root = join(process.cwd(), "prisma", "migrations");
  return readdirSync(root)
    .filter((entry) => statSync(join(root, entry)).isDirectory())
    .sort()
    .map((name) => ({
      name,
      checksum: createHash("sha256").update(readFileSync(join(root, name, "migration.sql"))).digest("hex"),
    }));
}

async function tableExists(client: PoolClient, table: string): Promise<boolean> {
  const rows = await client.query<{ present: boolean }>(
    `SELECT to_regclass(format('%I.%I', current_schema(), $1::text)) IS NOT NULL AS present`,
    [table],
  );
  return rows.rows[0]?.present ?? false;
}

async function columnExists(client: PoolClient, table: string, column: string): Promise<boolean> {
  const rows = await client.query<{ present: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = current_schema()
         AND table_name = $1
         AND column_name = $2
     ) AS present`,
    [table, column],
  );
  return rows.rows[0]?.present ?? false;
}

async function timed<T>(operation: () => Promise<T>): Promise<{ value: T; milliseconds: number }> {
  const started = performance.now();
  const value = await operation();
  return { value, milliseconds: Math.round((performance.now() - started) * 100) / 100 };
}

async function count(client: PoolClient, sql: string): Promise<number> {
  const rows = await client.query<CountRow>(sql);
  return number(rows.rows[0]?.total);
}

async function readOnlyProbe(client: PoolClient): Promise<{ rejected: boolean; sqlState: string }> {
  const probe = `__doleth_readonly_probe_${randomUUID().replaceAll("-", "")}`;
  await client.query("SAVEPOINT readonly_probe");
  try {
    await client.query(`CREATE TABLE public.${quoteIdentifier(probe)} ("id" integer)`);
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code) : "";
    if (code !== "25006") {
      await client.query("ROLLBACK");
      throw new Error(`READ_ONLY_PROBE_FAILED_WITH_${code || "UNKNOWN"}`);
    }
    await client.query("ROLLBACK TO SAVEPOINT readonly_probe");
    await client.query("RELEASE SAVEPOINT readonly_probe");
    return { rejected: true, sqlState: code };
  }
  await client.query("ROLLBACK");
  throw new Error("READ_ONLY_PROBE_UNEXPECTEDLY_SUCCEEDED");
}

async function migrationReport(client: PoolClient) {
  const local = localMigrations();
  if (!(await tableExists(client, "_prisma_migrations"))) {
    return {
      totalDatabaseRows: 0,
      duplicates: 0,
      failed: 0,
      rolledBack: 0,
      migrations: local.map<MigrationReport>((migration) => ({
        ...migration,
        database: false,
        startedAt: null,
        finishedAt: null,
        rolledBackAt: null,
        databaseChecksum: null,
        logsPresent: false,
        state: "PENDING",
      })),
    };
  }

  const database = await client.query<DatabaseMigration>(
    `SELECT migration_name, checksum, started_at, finished_at, rolled_back_at,
            applied_steps_count,
            COALESCE(length(logs), 0) > 0 AS logs_present
     FROM "_prisma_migrations"
     ORDER BY started_at, migration_name`,
  );
  const rows = database.rows;
  const names = new Set(local.map((migration) => migration.name));
  const migrations: MigrationReport[] = local.map((migration) => {
    const matchingRows = rows.filter((row) => row.migration_name === migration.name);
    const applied = matchingRows.find((row) => row.finished_at && !row.rolled_back_at) ?? matchingRows[0];
    return {
      ...migration,
      database: matchingRows.length > 0,
      startedAt: applied?.started_at?.toISOString() ?? null,
      finishedAt: applied?.finished_at?.toISOString() ?? null,
      rolledBackAt: applied?.rolled_back_at?.toISOString() ?? null,
      databaseChecksum: applied?.checksum ?? null,
      logsPresent: matchingRows.some((row) => row.logs_present),
      state: classifyMigration(migration, rows),
    };
  });

  for (const row of rows.filter((migration) => !names.has(migration.migration_name))) {
    migrations.push({
      name: row.migration_name,
      checksum: "",
      database: true,
      startedAt: row.started_at.toISOString(),
      finishedAt: row.finished_at?.toISOString() ?? null,
      rolledBackAt: row.rolled_back_at?.toISOString() ?? null,
      databaseChecksum: row.checksum,
      logsPresent: row.logs_present,
      state: "DATABASE_ONLY",
    });
  }

  const grouped = new Map<string, number>();
  for (const row of rows) grouped.set(row.migration_name, (grouped.get(row.migration_name) ?? 0) + 1);

  return {
    totalDatabaseRows: rows.length,
    duplicates: [...grouped.values()].filter((total) => total > 1).length,
    failed: rows.filter((row) => !row.finished_at && !row.rolled_back_at).length,
    rolledBack: rows.filter((row) => row.rolled_back_at).length,
    migrations,
  };
}

async function tableReports(client: PoolClient): Promise<{
  tables: TableReport[];
  ownerDistribution: { owner: string; rows: number }[];
  discoveredUserIdTables: string[];
}> {
  const discovered = await client.query<{ table_name: string }>(
    `SELECT table_name
     FROM information_schema.columns
     WHERE table_schema = current_schema() AND column_name = 'userId'
     ORDER BY table_name`,
  );
  const discoveredUserIdTables = discovered.rows.map((row) => row.table_name);
  const requestedTables = [...new Set([...KNOWN_TABLES, ...discoveredUserIdTables])];
  const hasUsers = await tableExists(client, "User");
  const ownerCounts = new Map<string, number>();
  const reports: TableReport[] = [];

  for (const table of requestedTables) {
    const exists = await tableExists(client, table);
    if (!exists) {
      reports.push({
        table,
        exists: false,
        rows: 0,
        owners: null,
        nullOwners: null,
        orphanOwners: null,
        duplicateIds: null,
        crossOwner: 0,
        state: "MISMATCH",
      });
      continue;
    }

    const quoted = quoteIdentifier(table);
    const rows = await count(client, `SELECT COUNT(*)::text AS total FROM ${quoted}`);
    const hasUserId = discoveredUserIdTables.includes(table);
    const hasId = await columnExists(client, table, "id");
    let owners: number | null = table === "User" ? rows : null;
    let nullOwners: number | null = null;
    let orphanOwners: number | null = null;

    if (hasUserId) {
      const ownership = await client.query<{ owners: string; nulls: string }>(
        `SELECT COUNT(DISTINCT "userId")::text AS owners,
                COUNT(*) FILTER (WHERE "userId" IS NULL)::text AS nulls
         FROM ${quoted}`,
      );
      owners = number(ownership.rows[0]?.owners);
      nullOwners = number(ownership.rows[0]?.nulls);
      orphanOwners = hasUsers
        ? await count(
            client,
            `SELECT COUNT(*)::text AS total
             FROM ${quoted} t
             LEFT JOIN "User" u ON u.id = t."userId"
             WHERE t."userId" IS NOT NULL AND u.id IS NULL`,
          )
        : null;

      const distribution = await client.query<{ owner: string; total: string }>(
        `SELECT "userId"::text AS owner, COUNT(*)::text AS total
         FROM ${quoted}
         WHERE "userId" IS NOT NULL
         GROUP BY "userId"`,
      );
      for (const row of distribution.rows) {
        ownerCounts.set(row.owner, (ownerCounts.get(row.owner) ?? 0) + number(row.total));
      }
    }

    const duplicateIds = hasId
      ? await count(
          client,
          `SELECT COUNT(*)::text AS total
           FROM (SELECT id FROM ${quoted} GROUP BY id HAVING COUNT(*) > 1) duplicates`,
        )
      : null;

    reports.push({
      table,
      exists: true,
      rows,
      owners,
      nullOwners,
      orphanOwners,
      duplicateIds,
      crossOwner: 0,
      state:
        (nullOwners ?? 0) === 0 && (orphanOwners ?? 0) === 0 && (duplicateIds ?? 0) === 0
          ? "MATCH"
          : "MISMATCH",
    });
  }

  const ownerDistribution = [...ownerCounts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, rows], index) => ({ owner: `OWNER_${index + 1}`, rows }));

  return { tables: reports, ownerDistribution, discoveredUserIdTables };
}

async function crossOwnerReport(client: PoolClient): Promise<Record<string, number>> {
  const checks: Record<string, { tables: string[]; sql: string }> = {
    transactionSourceAccount: {
      tables: ["Transaction", "Account"],
      sql: `SELECT COUNT(*)::text AS total
            FROM "Transaction" t JOIN "Account" a ON a.id = t."sourceAccountId"
            WHERE t."userId" IS DISTINCT FROM a."userId"`,
    },
    transactionDestinationAccount: {
      tables: ["Transaction", "Account"],
      sql: `SELECT COUNT(*)::text AS total
            FROM "Transaction" t JOIN "Account" a ON a.id = t."destinationAccountId"
            WHERE t."destinationAccountId" IS NOT NULL AND t."userId" IS DISTINCT FROM a."userId"`,
    },
    transactionCategory: {
      tables: ["Transaction", "Category"],
      sql: `SELECT COUNT(*)::text AS total
            FROM "Transaction" t JOIN "Category" c ON c.id = t."categoryId"
            WHERE t."categoryId" IS NOT NULL AND t."userId" IS DISTINCT FROM c."userId"`,
    },
    transactionCorrection: {
      tables: ["Transaction"],
      sql: `SELECT COUNT(*)::text AS total
            FROM "Transaction" t JOIN "Transaction" original ON original.id = t."correctedFromId"
            WHERE t."correctedFromId" IS NOT NULL AND t."userId" IS DISTINCT FROM original."userId"`,
    },
    ledgerAccount: {
      tables: ["LedgerEntry", "Account"],
      sql: `SELECT COUNT(*)::text AS total
            FROM "LedgerEntry" le JOIN "Account" a ON a.id = le."accountId"
            WHERE le."userId" IS DISTINCT FROM a."userId"`,
    },
    ledgerTransaction: {
      tables: ["LedgerEntry", "Transaction"],
      sql: `SELECT COUNT(*)::text AS total
            FROM "LedgerEntry" le JOIN "Transaction" t ON t.id = le."transactionId"
            WHERE le."userId" IS DISTINCT FROM t."userId"`,
    },
    upcomingAccount: {
      tables: ["UpcomingPayment", "Account"],
      sql: `SELECT COUNT(*)::text AS total
            FROM "UpcomingPayment" u JOIN "Account" a ON a.id = u."plannedAccountId"
            WHERE u."userId" IS DISTINCT FROM a."userId"`,
    },
    upcomingTransaction: {
      tables: ["UpcomingPayment", "Transaction"],
      sql: `SELECT COUNT(*)::text AS total
            FROM "UpcomingPayment" u JOIN "Transaction" t ON t.id = u."transactionId"
            WHERE u."transactionId" IS NOT NULL AND u."userId" IS DISTINCT FROM t."userId"`,
    },
  };

  const result: Record<string, number> = {};
  for (const [name, check] of Object.entries(checks)) {
    const ready = (
      await Promise.all(
        check.tables.map(async (table) => (await tableExists(client, table)) && (await columnExists(client, table, "userId"))),
      )
    ).every(Boolean);
    result[name] = ready ? await count(client, check.sql) : -1;
  }
  return result;
}

async function financialReport(client: PoolClient) {
  const ready = (
    await Promise.all(["Account", "Transaction", "LedgerEntry"].map((table) => tableExists(client, table)))
  ).every(Boolean);
  if (!ready) return { available: false };

  const summary = await client.query<{
    transactions: string;
    active: string;
    voided: string;
    corrected: string;
    transfers: string;
    future: string;
    invalid_amounts: string;
  }>(
    `SELECT COUNT(*)::text AS transactions,
            COUNT(*) FILTER (WHERE "voidedAt" IS NULL)::text AS active,
            COUNT(*) FILTER (WHERE "voidedAt" IS NOT NULL)::text AS voided,
            COUNT(*) FILTER (WHERE "correctedFromId" IS NOT NULL)::text AS corrected,
            COUNT(*) FILTER (WHERE type = 'TRANSFER')::text AS transfers,
            COUNT(*) FILTER (WHERE "occurredOn" > current_date)::text AS future,
            COUNT(*) FILTER (WHERE "amountCents" <= 0)::text AS invalid_amounts
     FROM "Transaction"`,
  );
  const ledger = await client.query<{ entries: string; debits: string; credits: string; zeros: string }>(
    `SELECT COUNT(*)::text AS entries,
            COUNT(*) FILTER (WHERE "amountCents" < 0)::text AS debits,
            COUNT(*) FILTER (WHERE "amountCents" > 0)::text AS credits,
            COUNT(*) FILTER (WHERE "amountCents" = 0)::text AS zeros
     FROM "LedgerEntry"`,
  );

  const movementWithoutLedger = await count(
    client,
    `SELECT COUNT(*)::text AS total
     FROM "Transaction" t
     WHERE NOT EXISTS (SELECT 1 FROM "LedgerEntry" le WHERE le."transactionId" = t.id)`,
  );
  const ledgerWithoutTransaction = await count(
    client,
    `SELECT COUNT(*)::text AS total
     FROM "LedgerEntry" le LEFT JOIN "Transaction" t ON t.id = le."transactionId"
     WHERE t.id IS NULL`,
  );
  const transferShape = await client.query<{ incomplete: string; imbalanced: string }>(
    `SELECT COUNT(*) FILTER (WHERE entries <> 2 OR "destinationAccountId" IS NULL)::text AS incomplete,
            COUNT(*) FILTER (WHERE net <> 0)::text AS imbalanced
     FROM (
       SELECT t.id, t."destinationAccountId", COUNT(le.id) AS entries,
              COALESCE(SUM(le."amountCents"), 0) AS net
       FROM "Transaction" t
       LEFT JOIN "LedgerEntry" le ON le."transactionId" = t.id
       WHERE t.type = 'TRANSFER'
       GROUP BY t.id, t."destinationAccountId"
     ) transfers`,
  );
  const nonTransferShape = await count(
    client,
    `SELECT COUNT(*)::text AS total
     FROM (
       SELECT t.id, COUNT(le.id) AS entries
       FROM "Transaction" t
       LEFT JOIN "LedgerEntry" le ON le."transactionId" = t.id
       WHERE t.type <> 'TRANSFER'
       GROUP BY t.id
       HAVING COUNT(le.id) <> 1
     ) invalid`,
  );
  const correctionIssues = await count(
    client,
    `SELECT COUNT(*)::text AS total
     FROM "Transaction" t
     LEFT JOIN "Transaction" original ON original.id = t."correctedFromId"
     WHERE t."correctedFromId" IS NOT NULL
       AND (original.id IS NULL OR original.id = t.id)`,
  );
  const accountProjection = await client.query<{ accounts: string; reconstructed: string }>(
    `SELECT COUNT(*)::text AS accounts,
            COUNT(("initialBalanceCents" + ledger_total))::text AS reconstructed
     FROM (
       SELECT a.id, a."initialBalanceCents",
              COALESCE(SUM(le."amountCents") FILTER (WHERE t."voidedAt" IS NULL), 0) AS ledger_total
       FROM "Account" a
       LEFT JOIN "LedgerEntry" le ON le."accountId" = a.id
       LEFT JOIN "Transaction" t ON t.id = le."transactionId"
       GROUP BY a.id, a."initialBalanceCents"
     ) balances`,
  );
  const voidedAggregation = await client.query<{ expected: string; reconstructed: string }>(
    `SELECT
       COALESCE(SUM(le."amountCents") FILTER (WHERE t."voidedAt" IS NULL), 0)::text AS expected,
       COALESCE(SUM(CASE WHEN t."voidedAt" IS NULL THEN le."amountCents" ELSE 0 END), 0)::text AS reconstructed
     FROM "LedgerEntry" le
     JOIN "Transaction" t ON t.id = le."transactionId"`,
  );

  const invalidUpcoming = (await tableExists(client, "UpcomingPayment"))
    ? await count(
        client,
        `SELECT COUNT(*)::text AS total
         FROM "UpcomingPayment"
         WHERE "estimatedCents" <= 0
            OR ("status" = 'PAID' AND "transactionId" IS NULL)
            OR ("status" = 'PENDING' AND "transactionId" IS NOT NULL)`,
      )
    : -1;
  const invalidInvestments = (await tableExists(client, "Investment"))
    ? await count(
        client,
        `SELECT COUNT(*)::text AS total
         FROM "Investment"
         WHERE "investedCents" < 0 OR "currentValueCents" < 0`,
      )
    : -1;

  const transaction = summary.rows[0];
  const entries = ledger.rows[0];
  const transfers = transferShape.rows[0];
  const balances = accountProjection.rows[0];
  const voided = voidedAggregation.rows[0];
  return {
    available: true,
    transactions: number(transaction?.transactions),
    active: number(transaction?.active),
    voided: number(transaction?.voided),
    corrected: number(transaction?.corrected),
    transfers: number(transaction?.transfers),
    ledgerEntries: number(entries?.entries),
    debitEntries: number(entries?.debits),
    creditEntries: number(entries?.credits),
    zeroEntries: number(entries?.zeros),
    movementWithoutLedger,
    ledgerWithoutTransaction,
    incompleteTransfers: number(transfers?.incomplete),
    imbalancedTransfers: number(transfers?.imbalanced),
    invalidNonTransferEntryCount: nonTransferShape,
    correctionIssues,
    futureMovements: number(transaction?.future),
    invalidTransactionAmounts: number(transaction?.invalid_amounts),
    invalidUpcomingPayments: invalidUpcoming,
    invalidInvestments,
    balancesReconstructible: number(balances?.accounts) === number(balances?.reconstructed) ? "MATCH" : "MISMATCH",
    voidedEntriesExcluded: voided?.expected === voided?.reconstructed ? "MATCH" : "MISMATCH",
    persistedBalanceProjection: "NOT_PRESENT",
  };
}

function action(code: string): string {
  return (
    {
      a: "NO ACTION",
      r: "RESTRICT",
      c: "CASCADE",
      n: "SET NULL",
      d: "SET DEFAULT",
    }[code] ?? code
  );
}

async function schemaReport(client: PoolClient) {
  const columns = await client.query<{
    table_name: string;
    column_name: string;
    is_nullable: string;
    data_type: string;
    udt_name: string;
  }>(
    `SELECT table_name, column_name, is_nullable, data_type, udt_name
     FROM information_schema.columns
     WHERE table_schema = current_schema()
       AND (
         column_name = 'userId'
         OR (table_name, column_name) IN (
           ('Account','initialBalanceCents'),
           ('Transaction','amountCents'),
           ('LedgerEntry','amountCents'),
           ('Investment','investedCents'),
           ('Investment','currentValueCents'),
           ('UpcomingPayment','estimatedCents')
         )
       )
     ORDER BY table_name, column_name`,
  );
  const indexes = await client.query<{ indexname: string; tablename: string; indexdef: string }>(
    `SELECT indexname, tablename, indexdef
     FROM pg_indexes
     WHERE schemaname = current_schema()
     ORDER BY tablename, indexname`,
  );
  const fks = await client.query<{
    name: string;
    table_name: string;
    definition: string;
    update_code: string;
    delete_code: string;
  }>(
    `SELECT constraint_name::text AS name,
            table_name::text,
            pg_get_constraintdef(oid, true) AS definition,
            confupdtype::text AS update_code,
            confdeltype::text AS delete_code
     FROM (
       SELECT c.oid, c.conname AS constraint_name, source.relname AS table_name,
              c.confupdtype, c.confdeltype
       FROM pg_constraint c
       JOIN pg_class source ON source.oid = c.conrelid
       JOIN pg_namespace n ON n.oid = source.relnamespace
       WHERE c.contype = 'f' AND n.nspname = current_schema()
     ) constraints
     ORDER BY table_name, name`,
  );

  const indexNames = new Set(indexes.rows.map((row) => row.indexname));
  const fkNames = new Set(fks.rows.map((row) => row.name));
  const financialOwnership = new Map(
    columns.rows
      .filter((row) => row.column_name === "userId" && FINANCIAL_TABLES.includes(row.table_name as never))
      .map((row) => [row.table_name, row]),
  );
  const money = MONEY_COLUMNS.map(([table, column]) => {
    const match = columns.rows.find((row) => row.table_name === table && row.column_name === column);
    return {
      table,
      column,
      type: match?.data_type ?? null,
      udt: match?.udt_name ?? null,
      state: match?.udt_name === "int8" ? "MATCH" : "MISMATCH",
    };
  });

  return {
    financialUserId: FINANCIAL_TABLES.map((table) => ({
      table,
      exists: financialOwnership.has(table),
      notNull: financialOwnership.get(table)?.is_nullable === "NO",
    })),
    ownershipIndexes: indexes.rows
      .filter((row) => row.indexdef.includes('"userId"'))
      .map((row) => ({
        table: row.tablename,
        name: row.indexname,
        unique: row.indexdef.includes(" UNIQUE INDEX "),
      })),
    missingOwnershipIndexes: EXPECTED_OWNERSHIP_INDEXES.filter((name) => !indexNames.has(name)),
    foreignKeys: fks.rows.map((row) => ({
      table: row.table_name,
      name: row.name,
      definition: row.definition,
      onUpdate: action(row.update_code),
      onDelete: action(row.delete_code),
    })),
    missingOwnershipForeignKeys: EXPECTED_OWNERSHIP_FKS.filter((name) => !fkNames.has(name)),
    money,
  };
}

async function main(): Promise<void> {
  currentStage = "configuration";
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL_REQUIRED");

  const target = new URL(connectionString);
  if (!["postgres:", "postgresql:"].includes(target.protocol)) throw new Error("POSTGRESQL_URL_REQUIRED");

  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 1_000,
    application_name: "doleth_neon_readonly_preflight",
  });

  currentStage = "connecting";
  const connected = await timed(() => pool.connect());
  const client = connected.value;
  let transactionActive = false;
  let rolledBack = false;

  try {
    currentStage = "session_guard";
    await client.query("SET default_transaction_read_only = on");
    await client.query("BEGIN");
    transactionActive = true;
    await client.query("SET TRANSACTION READ ONLY");
    await client.query("SET LOCAL statement_timeout = '5s'");
    await client.query("SET LOCAL lock_timeout = '2s'");
    await client.query("SET LOCAL idle_in_transaction_session_timeout = '30s'");

    const identity = await client.query<{
      version: string;
      server_version: string;
      server_time: Date;
      database: string;
      user_name: string;
      read_only: string;
      statement_timeout: string;
      lock_timeout: string;
      recovery: boolean;
    }>(
      `SELECT version(),
              current_setting('server_version') AS server_version,
              clock_timestamp() AS server_time,
              current_database() AS database,
              current_user AS user_name,
              current_setting('transaction_read_only') AS read_only,
              current_setting('statement_timeout') AS statement_timeout,
              current_setting('lock_timeout') AS lock_timeout,
              pg_is_in_recovery() AS recovery`,
    );
    if (identity.rows[0]?.read_only !== "on") throw new Error("TRANSACTION_NOT_READ_ONLY");

    currentStage = "write_probe";
    const probe = await readOnlyProbe(client);
    currentStage = "trivial_query";
    const trivial = await timed(() => client.query("SELECT 1 AS ok"));
    const analysisStarted = performance.now();

    currentStage = "migrations";
    const migrations = await migrationReport(client);
    currentStage = "ownership";
    const ownership = await tableReports(client);
    currentStage = "cross_owner";
    const crossOwner = await crossOwnerReport(client);
    const crossOwnerByTable: Record<string, string[]> = {
      Account: [
        "transactionSourceAccount",
        "transactionDestinationAccount",
        "ledgerAccount",
        "upcomingAccount",
      ],
      Category: ["transactionCategory"],
      Transaction: [
        "transactionSourceAccount",
        "transactionDestinationAccount",
        "transactionCategory",
        "transactionCorrection",
        "ledgerTransaction",
        "upcomingTransaction",
      ],
      LedgerEntry: ["ledgerAccount", "ledgerTransaction"],
      Investment: [],
      UpcomingPayment: ["upcomingAccount", "upcomingTransaction"],
    };
    for (const table of ownership.tables) {
      if (FINANCIAL_TABLES.includes(table.table as never)) {
        table.crossOwner = (crossOwnerByTable[table.table] ?? []).reduce(
          (sum, name) => sum + Math.max(0, crossOwner[name] ?? 0),
          0,
        );
        if (table.crossOwner > 0) table.state = "MISMATCH";
      }
    }
    currentStage = "financial";
    const financial = await financialReport(client);
    currentStage = "schema";
    const schema = await schemaReport(client);

    currentStage = "operational";
    const ssl = await client.query<{ ssl: boolean; version: string | null; cipher: string | null }>(
      `SELECT ssl, version, cipher FROM pg_stat_ssl WHERE pid = pg_backend_pid()`,
    );
    const connections = await client.query<{ current: string; maximum: string; reserved: string }>(
      `SELECT
         (SELECT COUNT(*)::text FROM pg_stat_activity WHERE datname = current_database()) AS current,
         current_setting('max_connections') AS maximum,
         current_setting('superuser_reserved_connections') AS reserved`,
    );

    const host = target.hostname;
    const endpoint = host.split(".")[0] ?? host;
    const regionMatch = host.match(/\.([a-z]{2}-[a-z]+-\d)\.(?:aws|azure)\.neon\.tech$/i);
    const sslMode = target.searchParams.get("sslmode") ?? "unspecified";
    const server = identity.rows[0];
    const sslState = ssl.rows[0];
    const connectionState = connections.rows[0];

    const report = {
      generatedAt: new Date().toISOString(),
      identity: {
        provider: host.endsWith(".neon.tech") ? "Neon" : "PostgreSQL",
        region: regionMatch?.[1] ?? "INCONCLUSIVE",
        host: mask(host),
        endpoint: mask(endpoint),
        database: mask(server?.database ?? ""),
        user: mask(server?.user_name ?? ""),
        branch: "INCONCLUSIVE_FROM_CONNECTION",
        serverVersion: server?.server_version ?? "unknown",
        serverTime: server?.server_time.toISOString() ?? null,
        pooled: endpoint.includes("-pooler"),
        sslMode,
        ssl: sslState?.ssl ?? false,
        tlsVersion: sslState?.version ?? null,
        tlsCipherPresent: Boolean(sslState?.cipher),
        inRecovery: server?.recovery ?? false,
      },
      readOnly: {
        sessionDefault: "on",
        transaction: server?.read_only ?? "unknown",
        statementTimeout: server?.statement_timeout ?? "unknown",
        lockTimeout: server?.lock_timeout ?? "unknown",
        writeProbeRejected: probe.rejected,
        writeProbeSqlState: probe.sqlState,
        rollback: "PENDING",
        persistentWrites: 0,
      },
      migrations,
      ownership,
      crossOwner,
      financial,
      schema,
      operational: {
        connectionMilliseconds: connected.milliseconds,
        trivialQueryMilliseconds: trivial.milliseconds,
        aggregateQueriesMilliseconds: Math.round((performance.now() - analysisStarted) * 100) / 100,
        currentDatabaseConnections: number(connectionState?.current),
        maxConnections: number(connectionState?.maximum),
        reservedConnections: number(connectionState?.reserved),
        planLimits: "INCONCLUSIVE_FROM_DATABASE",
      },
    };

    currentStage = "rollback";
    await client.query("ROLLBACK");
    transactionActive = false;
    rolledBack = true;
    report.readOnly.rollback = "CONFIRMED";
    console.info(`DOLETH_NEON_PREFLIGHT_JSON=${JSON.stringify(report)}`);
  } finally {
    if (transactionActive) {
      try {
        await client.query("ROLLBACK");
        rolledBack = true;
      } catch {
        rolledBack = false;
      }
    }
    client.release();
    await pool.end();
    if (!rolledBack) process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    const code =
      typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code) : "";
    console.error(`DOLETH_NEON_PREFLIGHT_FAILED=${currentStage}:${code || "SAFE_ABORT"}`);
    process.exitCode = 1;
  });
}
