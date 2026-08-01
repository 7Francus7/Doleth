import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { Pool } from "pg";
import {
  AdminAdoptionError,
  adminAdoptionConfirmationPhrase,
  runAdminAdoption,
} from "./lib/private-beta-admin-adoption";
import {
  AdminAdoptionConfigError,
  redactAdminAdoptionDatabase,
  resolveAdminAdoptionConfig,
} from "./lib/private-beta-admin-adoption-config";
import { emailError, normalizeEmail } from "../../src/lib/auth/validation";

/**
 * Adopción explícita del único usuario histórico como administrador privado.
 *
 * No lee DATABASE_URL, no tiene endpoint web y no ofrece confirmación silenciosa.
 * El prompt recibe ID/email localmente y solo imprime versiones redactadas.
 */

function mode(): "dry-run" | "execute" {
  const dryRun = process.argv.includes("--dry-run");
  const execute = process.argv.includes("--execute");
  if (dryRun === execute) throw new Error("MODE_REQUIRED");
  if (process.argv.some((value) => value.startsWith("--confirm") || value.startsWith("--user") || value.startsWith("--email"))) {
    throw new Error("SILENT_INPUT_FORBIDDEN");
  }
  return dryRun ? "dry-run" : "execute";
}

function printSummary(summary: Awaited<ReturnType<typeof runAdminAdoption>>["summary"], database: string): void {
  console.info("Preflight de adopción:");
  console.info(`  usuario encontrado: ${summary.userFound ? "sí" : "no"}`);
  console.info(`  id: ${summary.userId}`);
  console.info(`  email: ${summary.email}`);
  console.info(`  estado / rol: ${summary.status} / ${summary.role}`);
  console.info(`  email verificado: ${summary.emailVerified ? "sí" : "no"}`);
  console.info(`  cuentas/categorías/transacciones/ledger: ${summary.accounts}/${summary.categories}/${summary.transactions}/${summary.ledgerEntries}`);
  console.info(`  administradores activos: ${summary.activeAdmins}`);
  console.info(`  sesiones/tokens/invitaciones: ${summary.sessions}/${summary.authTokens}/${summary.privateBetaInvites}`);
  console.info(`  migraciones: ${summary.migrations}`);
  console.info(`  entorno: ${summary.environment}`);
  console.info(`  base: ${database}`);
}

async function main(): Promise<void> {
  const selectedMode = mode();
  const config = resolveAdminAdoptionConfig(process.env);
  if (!stdin.isTTY || !stdout.isTTY) throw new Error("INTERACTIVE_TERMINAL_REQUIRED");

  const prompt = createInterface({ input: stdin, output: stdout, terminal: true });
  let pool: Pool | null = null;
  try {
    const userId = (await prompt.question("ID exacto del usuario histórico: ")).trim();
    const email = normalizeEmail(await prompt.question("Email exacto del usuario histórico: "));
    if (!userId || emailError(email)) throw new Error("TARGET_INPUT_INVALID");

    pool = new Pool({
      application_name: "doleth_private_beta_admin_adoption",
      connectionString: config.connectionString,
      max: 1,
    });
    const dry = await runAdminAdoption({
      dryRun: true,
      email,
      metadata: config.metadata,
      pool,
      userId,
    });
    const redactedDatabase = redactAdminAdoptionDatabase(config.host, config.database);
    printSummary(dry.summary, redactedDatabase);
    if (dry.code === "ALREADY_ADOPTED") {
      console.info("ALREADY_ADOPTED");
      return;
    }
    console.info("Cambios propuestos: role USER→ADMIN; status PENDING_VERIFICATION→ACTIVE; privateBetaActivatedAt NULL→timestamp.");
    console.info("Preservados: emailVerifiedAt, email, passwordHash, name, updatedAt, sesiones, tokens, invitaciones y datos financieros.");
    if (selectedMode === "dry-run") {
      console.info("READY_TO_ADOPT (dry-run: 0 writes)");
      return;
    }

    const phrase = adminAdoptionConfirmationPhrase(config.environment, userId, email);
    console.info(`Para ejecutar escribí exactamente: ${phrase}`);
    const confirmation = await prompt.question("> ");
    if (confirmation !== phrase) throw new Error("CONFIRMATION_MISMATCH");

    const result = await runAdminAdoption({
      dryRun: false,
      email,
      metadata: config.metadata,
      pool,
      userId,
    });
    console.info(result.code);
  } finally {
    prompt.close();
    if (pool) await pool.end();
  }
}

main().catch((error: unknown) => {
  const code =
    error instanceof AdminAdoptionError || error instanceof AdminAdoptionConfigError
      ? error.code
      : error instanceof Error
        ? error.message
        : "SAFE_ABORT";
  console.error(`ADMIN_ADOPTION_ABORTED=${code}`);
  process.exitCode = 1;
});
