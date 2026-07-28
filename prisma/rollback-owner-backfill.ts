import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Deshace un backfill de propiedad: devuelve a `userId = NULL` las filas
 * financieras del owner indicado.
 *
 * Sólo tiene sentido inmediatamente después de un backfill equivocado, antes de
 * que el usuario haya cargado datos nuevos. Por eso exige `--confirm` y avisa si
 * detecta filas creadas después de la última corrida registrada.
 *
 * No borra nada: únicamente vacía la columna de propiedad.
 *
 * Uso:
 *   pnpm db:rollback-owner -- --email=vos@ejemplo.com --confirm
 */

function argument(name: string): string | undefined {
  const prefix = `--${name}=`;
  const match = process.argv.find((value) => value.startsWith(prefix));
  return match?.slice(prefix.length);
}

const TABLES = ["Account", "Category", "Transaction", "LedgerEntry", "Investment", "UpcomingPayment"] as const;

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL es obligatoria.");

  const email = argument("email")?.trim().toLowerCase();
  if (!email) throw new Error("Falta --email.");
  if (!process.argv.includes("--confirm")) {
    throw new Error("Agregá --confirm para ejecutar el rollback. Sin esa bandera no se escribe nada.");
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const owner = await prisma.user.findUnique({ where: { email } });
    if (!owner) throw new Error(`No existe un usuario con el correo ${email}.`);

    const lastRun = await prisma.ownerBackfillRun.findFirst({
      where: { ownerUserId: owner.id, dryRun: false },
      orderBy: { createdAt: "desc" },
    });
    if (!lastRun) throw new Error("No hay ninguna corrida de backfill registrada para este usuario.");

    const createdAfter = await prisma.account.count({
      where: { userId: owner.id, createdAt: { gt: lastRun.createdAt } },
    });
    if (createdAfter > 0) {
      console.warn(
        `⚠  Hay ${createdAfter} cuenta(s) creadas después del backfill. El rollback también las va a desvincular.`,
      );
    }

    const released: Record<string, number> = {};
    await prisma.$transaction(async (tx) => {
      for (const table of TABLES) {
        const rows = await tx.$queryRawUnsafe<{ total: bigint }[]>(
          `WITH released AS (
             UPDATE "${table}" SET "userId" = NULL WHERE "userId" = $1 RETURNING 1
           ) SELECT COUNT(*)::bigint AS total FROM released`,
          owner.id,
        );
        released[table] = Number(rows[0]?.total ?? 0n);
      }
      await tx.user.update({
        where: { id: owner.id },
        data: { onboardingStep: 0, onboardingCompletedAt: null },
      });
    });

    console.info(`Rollback del backfill de ${owner.email}:`);
    for (const table of TABLES) console.info(`  ${table.padEnd(16)} ${released[table] ?? 0}`);
    console.info("\n✔ Las filas volvieron a quedar sin propietario. No se borró ningún dato.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
