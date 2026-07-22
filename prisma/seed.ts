import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const categories = [
  ["salary", "Sueldo", "INCOME"],
  ["freelance", "Trabajo independiente", "INCOME"],
  ["sales", "Ventas", "INCOME"],
  ["other-income", "Otros ingresos", "INCOME"],
  ["food", "Comida", "EXPENSE"],
  ["transport", "Transporte", "EXPENSE"],
  ["gym", "Gimnasio", "EXPENSE"],
  ["padel", "Pádel", "EXPENSE"],
  ["technology", "Tecnología", "EXPENSE"],
  ["services", "Servicios", "EXPENSE"],
  ["outings", "Salidas", "EXPENSE"],
  ["shopping", "Compras", "EXPENSE"],
  ["other-expense", "Otros gastos", "EXPENSE"],
] as const;

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL es obligatoria para cargar categorías.");
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    for (const [slug, name, kind] of categories) {
      await prisma.category.upsert({
        where: { slug },
        update: { name, kind },
        create: { slug, name, kind },
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
