import "server-only";
import type { Prisma } from "../../generated/prisma/client";
import { getDb } from "../db";
import { DEFAULT_CATEGORIES } from "./categories";

type CategoryWriter = Pick<Prisma.TransactionClient, "category">;

/**
 * Deja al usuario con su catálogo de categorías.
 *
 * Idempotente: `skipDuplicates` sobre el único compuesto (userId, slug) permite
 * reintentar el onboarding sin duplicar nada. No crea cuentas ni movimientos: un
 * usuario nuevo empieza sin un solo dato financiero inventado.
 */
export async function provisionUserCategories(userId: string, client: CategoryWriter = getDb()): Promise<number> {
  const result = await client.category.createMany({
    data: DEFAULT_CATEGORIES.map((category) => ({ ...category, userId })),
    skipDuplicates: true,
  });
  return result.count;
}
