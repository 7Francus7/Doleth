import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

/**
 * Operación manual de bajas de cuenta.
 *
 * La aplicación registra el pedido en `User.deletionRequestedAt` y no borra
 * nada. Este comando es la contraparte operativa: permite listar los pedidos,
 * bloquear el acceso y —sólo con confirmación explícita— anonimizar la identidad
 * conservando la contabilidad.
 *
 * Reglas duras:
 *   - Nunca se ejecuta `DELETE FROM "User"` sobre una cuenta con datos
 *     financieros. Las claves foráneas son RESTRICT justamente para que un
 *     borrado accidental falle en vez de arrastrar finanzas por cascada.
 *   - Cada acción queda registrada en `AuthEvent`.
 *   - Nada dice "tus datos fueron eliminados" si sólo se bloqueó el acceso.
 *
 * Uso:
 *   pnpm db:deletions -- --list
 *   pnpm db:deletions -- --user-id=<id> --block --confirm
 *   pnpm db:deletions -- --user-id=<id> --anonymize --confirm
 *   pnpm db:deletions -- --user-id=<id> --restore --confirm
 */

function argument(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  return `${local.length <= 2 ? local : `${local.slice(0, 2)}…`}@${domain}`;
}

const FINANCIAL_TABLES = [
  "Account",
  "Category",
  "Transaction",
  "LedgerEntry",
  "Investment",
  "UpcomingPayment",
] as const;

async function financialFootprint(prisma: PrismaClient, userId: string): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const table of FINANCIAL_TABLES) {
    const rows = await prisma.$queryRawUnsafe<{ total: bigint }[]>(
      `SELECT COUNT(*)::bigint AS total FROM "${table}" WHERE "userId" = $1`,
      userId,
    );
    counts[table] = Number(rows[0]?.total ?? 0n);
  }
  return counts;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL es obligatoria.");

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    // ---- Listado ---------------------------------------------------------
    if (process.argv.includes("--list")) {
      const pending = await prisma.user.findMany({
        where: { deletionRequestedAt: { not: null } },
        orderBy: { deletionRequestedAt: "asc" },
        select: {
          id: true,
          email: true,
          status: true,
          deletionRequestedAt: true,
          createdAt: true,
        },
      });

      if (pending.length === 0) {
        console.info("No hay pedidos de baja pendientes.");
        return;
      }

      console.info(`Pedidos de baja: ${pending.length}\n`);
      for (const user of pending) {
        const footprint = await financialFootprint(prisma, user.id);
        const totalRows = Object.values(footprint).reduce((sum, value) => sum + value, 0);
        console.info(`  id=${user.id}`);
        console.info(`    correo:    ${maskEmail(user.email)}`);
        console.info(`    estado:    ${user.status}`);
        console.info(`    pedido:    ${user.deletionRequestedAt?.toISOString()}`);
        console.info(`    alta:      ${user.createdAt.toISOString()}`);
        console.info(`    filas financieras: ${totalRows} (${Object.entries(footprint)
          .filter(([, value]) => value > 0)
          .map(([table, value]) => `${table}=${value}`)
          .join(", ") || "ninguna"})`);
        console.info("");
      }
      console.info("Acciones disponibles: --block, --anonymize, --restore (todas requieren --confirm).");
      return;
    }

    const userId = argument("user-id");
    if (!userId) throw new Error("Falta --user-id (o usá --list).");

    const confirmed = process.argv.includes("--confirm");
    const block = process.argv.includes("--block");
    const anonymize = process.argv.includes("--anonymize");
    const restore = process.argv.includes("--restore");

    const chosen = [block, anonymize, restore].filter(Boolean).length;
    if (chosen !== 1) throw new Error("Elegí exactamente una acción: --block, --anonymize o --restore.");

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error(`No existe el usuario ${userId}.`);

    const footprint = await financialFootprint(prisma, user.id);
    const totalRows = Object.values(footprint).reduce((sum, value) => sum + value, 0);

    console.info(`Usuario:  ${user.id}`);
    console.info(`Correo:   ${maskEmail(user.email)}`);
    console.info(`Estado:   ${user.status}`);
    console.info(`Pedido de baja: ${user.deletionRequestedAt?.toISOString() ?? "sin pedido registrado"}`);
    console.info(`Filas financieras: ${totalRows}`);

    if (!confirmed) {
      console.info("\n(simulación) Agregá --confirm para ejecutar. No se escribió nada.");
      return;
    }

    // ---- Bloquear acceso -------------------------------------------------
    if (block) {
      if (!user.deletionRequestedAt) {
        throw new Error("Este usuario no pidió la baja. No se bloquea una cuenta sin pedido registrado.");
      }
      const revoked = await prisma.session.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await prisma.authToken.updateMany({
        where: { userId: user.id, consumedAt: null },
        data: { consumedAt: new Date() },
      });
      await prisma.user.update({ where: { id: user.id }, data: { status: "SUSPENDED" } });
      await prisma.authEvent.create({
        data: {
          userId: user.id,
          type: "SESSIONS_REVOKED",
          context: `baja:bloqueo_acceso:${revoked.count}`,
        },
      });

      console.info(`\n✔ Acceso bloqueado. Sesiones revocadas: ${revoked.count}.`);
      console.info("  La cuenta queda SUSPENDED. Los datos financieros siguen intactos.");
      console.info("  Esto NO es un borrado: no le digas a la persona que se eliminaron sus datos.");
      return;
    }

    // ---- Restaurar -------------------------------------------------------
    if (restore) {
      await prisma.user.update({
        where: { id: user.id },
        data: { status: "ACTIVE", deletionRequestedAt: null },
      });
      await prisma.authEvent.create({
        data: { userId: user.id, type: "ACCOUNT_DELETION_CANCELED", context: "restaurado_manualmente" },
      });
      console.info("\n✔ Cuenta restaurada a ACTIVE y pedido de baja cancelado.");
      console.info("  La persona tiene que volver a iniciar sesión: las sesiones anteriores siguen revocadas.");
      return;
    }

    // ---- Anonimizar ------------------------------------------------------
    // Se conserva la contabilidad y se destruye la identidad. Es la única
    // operación irreversible de este comando.
    if (anonymize) {
      if (!user.deletionRequestedAt) {
        throw new Error("Este usuario no pidió la baja. No se anonimiza una cuenta sin pedido registrado.");
      }
      if (user.status !== "SUSPENDED") {
        throw new Error("Bloqueá el acceso con --block antes de anonimizar, para no anonimizar una sesión viva.");
      }

      const anonymousEmail = `anonimizado+${user.id}@doleth.invalid`;
      await prisma.$transaction(async (tx) => {
        await tx.session.deleteMany({ where: { userId: user.id } });
        await tx.authToken.deleteMany({ where: { userId: user.id } });
        await tx.user.update({
          where: { id: user.id },
          data: {
            name: "Cuenta dada de baja",
            email: anonymousEmail,
            // Hash imposible de satisfacer: no valida contra ninguna contraseña.
            passwordHash: "scrypt$65536$8$2$YW5vbmltbw$YW5vbmltbw",
            status: "DELETED",
            emailVerifiedAt: null,
            lastLoginAt: null,
            passwordChangedAt: new Date(),
          },
        });
        // La bitácora se conserva, pero deja de apuntar a una persona.
        await tx.authEvent.updateMany({ where: { userId: user.id }, data: { emailHash: null } });
      });

      await prisma.authEvent.create({
        data: {
          userId: user.id,
          type: "ACCOUNT_DELETION_REQUESTED",
          context: `baja:anonimizado:filas_financieras=${totalRows}`,
        },
      });

      console.info("\n✔ Identidad anonimizada. La cuenta queda DELETED y no puede iniciar sesión.");
      console.info(`  Se conservaron ${totalRows} filas financieras, ahora sin persona asociada.`);
      console.info("  Si la política aprobada exige destruir también la contabilidad, hacelo como paso");
      console.info("  separado y documentado: este comando no lo hace por diseño.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(`\n✖ ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
