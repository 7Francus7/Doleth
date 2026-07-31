import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEFAULT_CATEGORIES } from "../src/lib/finance/categories";

/**
 * Desde el corte multiusuario las categorías pertenecen a cada usuario y se crean
 * durante el onboarding, así que el seed ya no carga un catálogo global.
 *
 * Lo que sí hace es reparar usuarios que quedaron sin catálogo (por ejemplo, si
 * un onboarding se interrumpió a mitad de camino). Es idempotente y no crea
 * cuentas ni movimientos: ningún dato de ejemplo entra a la base.
 */
async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL es obligatoria para ejecutar el seed.");

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const users = await prisma.user.findMany({
      where: { status: { in: ["ACTIVE", "PENDING_VERIFICATION"] } },
      select: { id: true, email: true },
    });

    let repaired = 0;
    for (const user of users) {
      const result = await prisma.category.createMany({
        data: DEFAULT_CATEGORIES.map((category) => ({ ...category, userId: user.id })),
        skipDuplicates: true,
      });
      if (result.count > 0) {
        repaired += 1;
        console.info(`Categorías repuestas para ${user.id}: ${result.count}`);
      }
    }

    console.info(
      repaired === 0
        ? `Sin cambios: ${users.length} usuario(s) ya tienen su catálogo completo.`
        : `Catálogo reparado en ${repaired} de ${users.length} usuario(s).`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
