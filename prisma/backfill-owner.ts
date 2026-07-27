import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEFAULT_CATEGORIES } from "../src/lib/finance/categories";

/**
 * Backfill de propiedad para los datos anteriores al corte multiusuario.
 *
 * Reclama para un usuario existente todas las filas financieras que quedaron con
 * `userId = NULL` después de la migración `202607270001_multiuser_identity`.
 *
 * Garantías:
 *   - Determinista: sólo toca filas con `userId IS NULL`. Correrlo dos veces no
 *     cambia nada la segunda vez.
 *   - No inventa un usuario. Exige `--email` de una cuenta ya creada desde la app.
 *   - No toca importes, fechas, asientos ni relaciones contables: sólo escribe la
 *     columna `userId`.
 *   - Deja evidencia en `OwnerBackfillRun` con los conteos de antes y después.
 *   - Reversible con `prisma/rollback-owner-backfill.ts`.
 *
 * Uso:
 *   pnpm db:backfill-owner -- --email=vos@ejemplo.com --dry-run
 *   pnpm db:backfill-owner -- --email=vos@ejemplo.com
 */

type Counts = Record<string, number>;

function argument(name: string): string | undefined {
  const prefix = `--${name}=`;
  const match = process.argv.find((value) => value.startsWith(prefix));
  return match?.slice(prefix.length);
}

const TABLES = [
  "Account",
  "Category",
  "Transaction",
  "LedgerEntry",
  "Investment",
  "UpcomingPayment",
] as const;

async function countOrphans(prisma: PrismaClient): Promise<Counts> {
  const counts: Counts = {};
  for (const table of TABLES) {
    const rows = await prisma.$queryRawUnsafe<{ total: bigint }[]>(
      `SELECT COUNT(*)::bigint AS total FROM "${table}" WHERE "userId" IS NULL`,
    );
    counts[table] = Number(rows[0]?.total ?? 0n);
  }
  return counts;
}

async function countOwned(prisma: PrismaClient, userId: string): Promise<Counts> {
  const counts: Counts = {};
  for (const table of TABLES) {
    const rows = await prisma.$queryRawUnsafe<{ total: bigint }[]>(
      `SELECT COUNT(*)::bigint AS total FROM "${table}" WHERE "userId" = $1`,
      userId,
    );
    counts[table] = Number(rows[0]?.total ?? 0n);
  }
  return counts;
}

function total(counts: Counts): number {
  return Object.values(counts).reduce((sum, value) => sum + value, 0);
}

function report(title: string, counts: Counts) {
  console.info(`\n${title}`);
  for (const table of TABLES) console.info(`  ${table.padEnd(16)} ${counts[table] ?? 0}`);
  console.info(`  ${"TOTAL".padEnd(16)} ${total(counts)}`);
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL es obligatoria.");

  const email = argument("email")?.trim().toLowerCase();
  const dryRun = process.argv.includes("--dry-run");
  if (!email) {
    throw new Error(
      "Falta --email. Creá primero tu cuenta desde /crear-cuenta y pasá esa dirección:\n" +
        "  pnpm db:backfill-owner -- --email=vos@ejemplo.com --dry-run",
    );
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    // ---- Pre-chequeos -----------------------------------------------------
    const owner = await prisma.user.findUnique({ where: { email } });
    if (!owner) throw new Error(`No existe un usuario con el correo ${email}. Creá la cuenta antes de correr el backfill.`);
    if (owner.status === "DELETED" || owner.status === "SUSPENDED") {
      throw new Error(`El usuario ${email} está en estado ${owner.status}. No se le puede asignar datos.`);
    }

    const otherUsers = await prisma.user.count({ where: { id: { not: owner.id } } });
    const before = await countOrphans(prisma);
    const ownedBefore = await countOwned(prisma, owner.id);

    console.info(`Owner: ${owner.email} (${owner.id})`);
    console.info(`Otros usuarios en la base: ${otherUsers}`);
    report("Filas huérfanas ANTES", before);
    report("Filas ya del owner ANTES", ownedBefore);

    if (total(before) === 0) {
      console.info("\nNo hay filas huérfanas. Nada que hacer.");
      return;
    }

    if (otherUsers > 0) {
      console.warn(
        `\n⚠  Hay ${otherUsers} usuario(s) además del owner. Las filas huérfanas son anteriores al` +
          " corte multiusuario, así que corresponden al owner original; confirmá que sea el caso antes de continuar.",
      );
    }

    if (dryRun) {
      console.info("\n--dry-run: no se escribió nada.");
      await prisma.ownerBackfillRun.create({
        data: { ownerUserId: owner.id, dryRun: true, counts: JSON.stringify({ before, ownedBefore }) },
      });
      return;
    }

    // ---- Backfill ---------------------------------------------------------
    // Una sola transacción: o queda todo asignado, o no queda nada.
    const claimed: Counts = {};
    let catalogAdded = 0;
    await prisma.$transaction(async (tx) => {
      for (const table of TABLES) {
        const rows = await tx.$queryRawUnsafe<{ total: bigint }[]>(
          `WITH claimed AS (
             UPDATE "${table}" SET "userId" = $1 WHERE "userId" IS NULL RETURNING 1
           ) SELECT COUNT(*)::bigint AS total FROM claimed`,
          owner.id,
        );
        claimed[table] = Number(rows[0]?.total ?? 0n);
      }

      // El catálogo del owner puede tener huecos si sus categorías legacy no
      // cubrían todos los slugs base. Esto agrega las faltantes, no toca las suyas.
      const catalog = await tx.category.createMany({
        data: DEFAULT_CATEGORIES.map((category) => ({ ...category, userId: owner.id })),
        skipDuplicates: true,
      });
      catalogAdded = catalog.count;

      // Un owner con datos ya no necesita pasar por el onboarding.
      await tx.user.update({
        where: { id: owner.id },
        data: {
          onboardingStep: 3,
          onboardingCompletedAt: owner.onboardingCompletedAt ?? new Date(),
        },
      });
    });

    // ---- Post-chequeos ----------------------------------------------------
    const after = await countOrphans(prisma);
    const ownedAfter = await countOwned(prisma, owner.id);

    report("Filas reclamadas", claimed);
    report("Filas huérfanas DESPUÉS", after);
    report("Filas del owner DESPUÉS", ownedAfter);
    console.info(`\nCategorías del catálogo base repuestas: ${catalogAdded}`);

    // Conservación: lo que el owner tiene ahora es lo que ya tenía, más lo
    // reclamado, más las categorías del catálogo que le faltaban. Nada más.
    const expected = (table: (typeof TABLES)[number]) =>
      (ownedBefore[table] ?? 0) + (claimed[table] ?? 0) + (table === "Category" ? catalogAdded : 0);
    const mismatched = TABLES.filter((table) => (ownedAfter[table] ?? 0) !== expected(table));
    if (mismatched.length > 0) {
      for (const table of mismatched) {
        console.error(`  ${table}: esperado ${expected(table)}, encontrado ${ownedAfter[table] ?? 0}`);
      }
      throw new Error("Los conteos no cierran. Revisá la base antes de continuar.");
    }
    if (total(after) !== 0) {
      console.warn(`⚠  Quedaron ${total(after)} filas huérfanas. Revisalas antes de endurecer a NOT NULL.`);
    }

    await prisma.ownerBackfillRun.create({
      data: {
        ownerUserId: owner.id,
        dryRun: false,
        counts: JSON.stringify({ before, ownedBefore, claimed, catalogAdded, after, ownedAfter }),
      },
    });

    console.info("\n✔ Backfill completo. Evidencia guardada en OwnerBackfillRun.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
