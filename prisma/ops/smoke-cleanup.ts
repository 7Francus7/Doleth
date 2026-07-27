import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

/**
 * Limpieza auditada de los datos del smoke test productivo.
 *
 * El smoke crea cuentas reales en producción. Para poder borrarlas después sin
 * riesgo, tienen que ser identificables sin ambigüedad: el procedimiento exige
 * que el correo empiece con el prefijo reservado `doleth-smoke+`.
 *
 * Este comando SÓLO toca usuarios cuyo correo empieza con ese prefijo. Si un
 * correo no lo lleva, no se borra: se avisa y se sale. Nunca puede tocar los
 * datos del owner ni de un usuario real.
 *
 * Uso:
 *   pnpm db:smoke-cleanup -- --list
 *   pnpm db:smoke-cleanup -- --email=doleth-smoke+20260727@tu-dominio --confirm
 *   pnpm db:smoke-cleanup -- --all --confirm
 */

const SMOKE_PREFIX = "doleth-smoke+";

function argument(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

function isSmokeEmail(email: string): boolean {
  return email.trim().toLowerCase().startsWith(SMOKE_PREFIX);
}

/**
 * Borra en el orden que exigen las restricciones. Todo dentro de una
 * transacción: si algo falla, no queda un usuario a medio borrar.
 */
async function purge(prisma: PrismaClient, userId: string): Promise<Record<string, number>> {
  const removed: Record<string, number> = {};
  await prisma.$transaction(async (tx) => {
    removed.LedgerEntry = (await tx.ledgerEntry.deleteMany({ where: { userId } })).count;
    removed.UpcomingPayment = (await tx.upcomingPayment.deleteMany({ where: { userId } })).count;
    // Romper la cadena de correcciones antes de borrar: `correctedFromId` es
    // una autorreferencia con RESTRICT.
    await tx.transaction.updateMany({ where: { userId }, data: { correctedFromId: null } });
    removed.Transaction = (await tx.transaction.deleteMany({ where: { userId } })).count;
    removed.Investment = (await tx.investment.deleteMany({ where: { userId } })).count;
    removed.Account = (await tx.account.deleteMany({ where: { userId } })).count;
    removed.Category = (await tx.category.deleteMany({ where: { userId } })).count;
    removed.Session = (await tx.session.deleteMany({ where: { userId } })).count;
    removed.AuthToken = (await tx.authToken.deleteMany({ where: { userId } })).count;
    removed.AuthEvent = (await tx.authEvent.deleteMany({ where: { userId } })).count;
    await tx.user.delete({ where: { id: userId } });
    removed.User = 1;
  });
  return removed;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL es obligatoria.");

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const candidates = await prisma.user.findMany({
      where: { email: { startsWith: SMOKE_PREFIX } },
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, status: true, createdAt: true },
    });

    if (process.argv.includes("--list")) {
      if (candidates.length === 0) {
        console.info(`No hay usuarios con el prefijo reservado "${SMOKE_PREFIX}".`);
        return;
      }
      console.info(`Usuarios de smoke encontrados: ${candidates.length}\n`);
      for (const user of candidates) {
        console.info(`  ${user.email}  id=${user.id}  estado=${user.status}  alta=${user.createdAt.toISOString()}`);
      }
      return;
    }

    const email = argument("email")?.trim().toLowerCase();
    const all = process.argv.includes("--all");
    const confirmed = process.argv.includes("--confirm");

    if (!email && !all) throw new Error("Indicá --email=<correo> o --all (o usá --list).");

    // Guarda dura: el prefijo reservado es lo único que autoriza un borrado.
    if (email && !isSmokeEmail(email)) {
      throw new Error(
        `El correo indicado no empieza con "${SMOKE_PREFIX}". Este comando sólo borra datos de smoke test. ` +
          "Para bajas de usuarios reales usá `pnpm db:deletions`.",
      );
    }

    const targets = email ? candidates.filter((user) => user.email.toLowerCase() === email) : candidates;

    if (targets.length === 0) {
      console.info("No se encontró ningún usuario de smoke que coincida.");
      return;
    }

    console.info(`Usuarios a borrar: ${targets.length}`);
    for (const user of targets) console.info(`  ${user.email}  id=${user.id}`);

    if (!confirmed) {
      console.info("\n(simulación) Agregá --confirm para borrar. No se escribió nada.");
      return;
    }

    for (const user of targets) {
      // Doble verificación antes de escribir: el filtro de la consulta ya lo
      // garantiza, pero esto protege contra un cambio futuro en la consulta.
      if (!isSmokeEmail(user.email)) {
        throw new Error(`Abortado: ${user.id} no tiene el prefijo reservado.`);
      }
      const removed = await purge(prisma, user.id);
      const detail = Object.entries(removed)
        .filter(([, value]) => value > 0)
        .map(([table, value]) => `${table}=${value}`)
        .join(", ");
      console.info(`  ✔ ${user.email} borrado (${detail})`);
    }

    console.info("\n✔ Limpieza del smoke completa. Ningún dato de usuarios reales fue tocado.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(`\n✖ ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
