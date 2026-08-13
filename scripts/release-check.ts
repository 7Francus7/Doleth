import { spawnSync } from "node:child_process";
import { config as loadEnv } from "dotenv";
import {
  TestDatabaseConfigError,
  resolveTestDatabaseUrl,
} from "../src/test/database-url";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ quiet: true });

function fail(message: string): never {
  console.error(`\nRELEASE CHECK: BLOQUEADO\n${message}\n`);
  process.exit(1);
}

let testDatabaseUrl: string | null;

try {
  testDatabaseUrl = resolveTestDatabaseUrl({
    ...process.env,
    DOLETH_REQUIRE_DB: "1",
  });
} catch (error) {
  if (error instanceof TestDatabaseConfigError) fail(error.message);
  throw error;
}

if (!testDatabaseUrl) {
  fail(
    "Falta TEST_DATABASE_URL. Configurala con una base PostgreSQL descartable cuyo nombre incluya test, ci, pruebas o rehearsal. DATABASE_URL nunca se usa como reemplazo.",
  );
}

const pnpmCli = process.env.npm_execpath;
const command = pnpmCli ? process.execPath : "pnpm";
const commandPrefix = pnpmCli ? [pnpmCli] : [];
const sharedEnv = {
  ...process.env,
  TEST_DATABASE_URL: testDatabaseUrl,
  DOLETH_REQUIRE_DB: "1",
  DOLETH_SESSION_SECRET:
    process.env.DOLETH_SESSION_SECRET ??
    "release-check-local-secret-with-more-than-thirty-two-characters",
  DOLETH_APP_URL: process.env.DOLETH_APP_URL ?? "http://localhost:3000",
  DOLETH_EMAIL_TRANSPORT: "console",
};

const steps = [
  { label: "Migraciones", args: ["db:migrate"], database: true },
  { label: "Auditoría de migraciones", args: ["db:audit-migrations"], database: true },
  { label: "Lint", args: ["lint"] },
  { label: "Typecheck", args: ["typecheck"] },
  { label: "Tests", args: ["test"] },
  { label: "Aislamiento bloqueante", args: ["test:isolation"] },
  { label: "Build", args: ["build"], database: true },
  { label: "Storybook", args: ["build-storybook"] },
] as const;

for (const step of steps) {
  console.log(`\n=== ${step.label} ===`);
  const result = spawnSync(command, [...commandPrefix, ...step.args], {
    cwd: process.cwd(),
    env: "database" in step && step.database
      ? { ...sharedEnv, DATABASE_URL: testDatabaseUrl }
      : sharedEnv,
    stdio: "inherit",
  });

  if (result.error) fail(`${step.label}: ${result.error.message}`);
  if (result.status !== 0) {
    fail(`${step.label} falló con código ${result.status ?? "desconocido"}.`);
  }
}

console.log("\nRELEASE CHECK: PASS\n");
