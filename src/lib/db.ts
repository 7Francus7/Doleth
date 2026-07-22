import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as { dolethPrisma?: PrismaClient };

export function getDb(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL no está configurada. Conectá PostgreSQL antes de usar datos reales.");
  }

  if (!globalForPrisma.dolethPrisma) {
    globalForPrisma.dolethPrisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString }),
    });
  }

  return globalForPrisma.dolethPrisma;
}
