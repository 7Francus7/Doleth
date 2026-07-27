import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

/**
 * Auditoría del historial de migraciones.
 *
 * Verifica tres cosas que rompen despliegues en silencio:
 *   1. Que ninguna migración aplicada haya sido editada después (deriva de checksum).
 *   2. Que no haya migraciones a medio aplicar ni marcadas como revertidas.
 *   3. Que la carpeta y la base coincidan en ambos sentidos.
 *
 * Es read-only. Corre en CI y como paso previo a cualquier despliegue.
 */

const MIGRATIONS_DIR = join(process.cwd(), "prisma", "migrations");

interface AppliedMigration {
  migration_name: string;
  checksum: string;
  finished_at: Date | null;
  rolled_back_at: Date | null;
  applied_steps_count: number;
}

/** Prisma calcula el checksum como SHA-256 del contenido del archivo. */
function checksumOf(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function localMigrations(): { name: string; checksum: string }[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((entry) => statSync(join(MIGRATIONS_DIR, entry)).isDirectory())
    .sort()
    .map((name) => ({ name, checksum: checksumOf(join(MIGRATIONS_DIR, name, "migration.sql")) }));
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL es obligatoria.");

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  const problems: string[] = [];

  try {
    const local = localMigrations();
    console.info(`Migraciones en el repositorio: ${local.length}`);
    for (const migration of local) console.info(`  ${migration.name}  ${migration.checksum.slice(0, 12)}…`);

    const applied = await prisma.$queryRaw<AppliedMigration[]>`
      SELECT migration_name, checksum, finished_at, rolled_back_at, applied_steps_count
      FROM _prisma_migrations ORDER BY started_at
    `;

    console.info(`\nMigraciones registradas en la base: ${applied.length}`);

    // Una migración puede aparecer varias veces: si falló y se recuperó con
    // `migrate resolve --rolled-back`, queda la fila revertida más la exitosa.
    // Para cotejar contra la carpeta vale la aplicación exitosa.
    const successfulByName = new Map<string, AppliedMigration>();
    for (const migration of applied) {
      if (migration.finished_at && !migration.rolled_back_at) successfulByName.set(migration.migration_name, migration);
    }

    for (const migration of applied) {
      const state = migration.rolled_back_at
        ? "REVERTIDA"
        : migration.finished_at
          ? "aplicada"
          : "INCOMPLETA";
      console.info(`  ${state.padEnd(10)} ${migration.migration_name}  ${migration.checksum.slice(0, 12)}…`);

      if (!migration.finished_at && !migration.rolled_back_at) {
        problems.push(
          `${migration.migration_name} quedó a medio aplicar. Resolvela con ` +
            `\`prisma migrate resolve --rolled-back ${migration.migration_name}\` antes de continuar.`,
        );
      }
      // Una revertida sólo es un problema si nunca llegó a aplicarse con éxito.
      if (migration.rolled_back_at && !successfulByName.has(migration.migration_name)) {
        problems.push(
          `${migration.migration_name} figura como revertida y nunca se aplicó con éxito. ` +
            "Volvé a aplicarla o quitala del repositorio.",
        );
      }
    }

    console.info("\nCotejo carpeta ↔ base:");
    const pendingCheck = new Map(successfulByName);
    for (const migration of local) {
      const match = pendingCheck.get(migration.name);
      if (!match) {
        console.info(`  ⧗ ${migration.name}: pendiente de aplicar`);
        continue;
      }
      if (match.checksum !== migration.checksum) {
        console.info(`  ✖ ${migration.name}: CHECKSUM DISTINTO`);
        problems.push(
          `${migration.name} fue modificada después de aplicarse ` +
            `(base ${match.checksum.slice(0, 12)}… ≠ archivo ${migration.checksum.slice(0, 12)}…). ` +
            "Nunca edites una migración ya aplicada: creá una nueva.",
        );
      } else {
        console.info(`  ✔ ${migration.name}`);
      }
      pendingCheck.delete(migration.name);
    }

    for (const orphan of pendingCheck.keys()) {
      console.info(`  ✖ ${orphan}: registrada en la base pero ausente del repositorio`);
      problems.push(`${orphan} está aplicada en la base pero no existe en prisma/migrations.`);
    }

    if (problems.length > 0) {
      console.error("\n✖ AUDITORÍA DE MIGRACIONES FALLIDA:");
      for (const problem of problems) console.error(`   - ${problem}`);
      process.exitCode = 1;
      return;
    }

    console.info("\n✔ Historial de migraciones consistente.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(`\n✖ ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
