import { randomUUID } from "node:crypto";
import { getDb } from "../lib/db";
import { DEFAULT_CATEGORIES } from "../lib/finance/categories";
import { createPostings } from "../lib/finance/domain";

/**
 * Ayudas para las pruebas de integración.
 *
 * Cada usuario de prueba nace con un correo único, así que dos corridas
 * simultáneas no se pisan y no hace falta vaciar la base entre tests.
 */

/**
 * ¿Hay una base real disponible?
 *
 * Las suites de aislamiento y de identidad no tienen valor sin Postgres, así que
 * se omiten cuando no hay conexión. Omitirlas en CI sería peor que no tenerlas:
 * daría verde sin haber probado lo único bloqueante del corte. Por eso, cuando
 * `DOLETH_REQUIRE_DB` está activo —el job de CI lo activa siempre— la ausencia
 * de base es un fallo duro y ruidoso, no un skip silencioso.
 */
function resolveDatabaseAvailability(): boolean {
  const available = Boolean(process.env.DATABASE_URL);
  const required = process.env.DOLETH_REQUIRE_DB === "1";
  if (required && !available) {
    throw new Error(
      "DOLETH_REQUIRE_DB=1 pero no hay DATABASE_URL ni TEST_DATABASE_URL. " +
        "Las pruebas de aislamiento multiusuario son bloqueantes y no pueden omitirse en CI.",
    );
  }
  return available;
}

export const hasDatabase = resolveDatabaseAvailability();

export interface TestUser {
  id: string;
  email: string;
  accountId: string;
  secondAccountId: string;
  categoryId: string;
  transactionId: string;
  investmentId: string;
  upcomingPaymentId: string;
}

/** Crea un usuario activo con su catálogo, dos cuentas y un movimiento de cada tipo. */
export async function createTestUser(label: string): Promise<TestUser> {
  const db = getDb();
  const email = `${label}-${randomUUID()}@pruebas.doleth.local`;

  const user = await db.user.create({
    data: {
      name: `Usuaria ${label}`,
      email,
      // Hash con formato válido; ninguna prueba de este archivo verifica contraseñas.
      passwordHash: "scrypt$65536$8$2$c2FsdGVzdA$aGFzaGRlcHJ1ZWJhbm9zaXJ2ZXBhcmFuYWRhMDA",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      onboardingStep: 3,
      onboardingCompletedAt: new Date(),
    },
  });

  await db.category.createMany({
    data: DEFAULT_CATEGORIES.map((category) => ({ ...category, userId: user.id })),
  });

  const [account, secondAccount] = await Promise.all([
    db.account.create({
      data: { userId: user.id, name: `Cuenta ${label}`, type: "BANK", initialBalanceCents: 100_000n },
    }),
    db.account.create({
      data: { userId: user.id, name: `Ahorro ${label}`, type: "SAVINGS", initialBalanceCents: 50_000n },
    }),
  ]);

  const category = await db.category.findFirstOrThrow({ where: { userId: user.id, slug: "food" } });

  const transaction = await db.transaction.create({
    data: {
      userId: user.id,
      type: "EXPENSE",
      amountCents: 12_345n,
      occurredOn: new Date("2026-07-10T00:00:00.000Z"),
      description: `Gasto de ${label}`,
      sourceAccountId: account.id,
      categoryId: category.id,
      idempotencyKey: `seed-${randomUUID()}`,
      entries: {
        create: createPostings("EXPENSE", 12_345n, account.id).map((posting) => ({
          ...posting,
          userId: user.id,
        })),
      },
    },
  });

  const [investment, upcomingPayment] = await Promise.all([
    db.investment.create({
      data: {
        userId: user.id,
        name: `Cartera ${label}`,
        kind: "STOCKS",
        investedCents: 200_000n,
        currentValueCents: 240_000n,
      },
    }),
    db.upcomingPayment.create({
      data: {
        userId: user.id,
        concept: `Alquiler ${label}`,
        estimatedCents: 300_000n,
        dueOn: new Date("2026-07-31T00:00:00.000Z"),
        plannedAccountId: account.id,
      },
    }),
  ]);

  return {
    id: user.id,
    email,
    accountId: account.id,
    secondAccountId: secondAccount.id,
    categoryId: category.id,
    transactionId: transaction.id,
    investmentId: investment.id,
    upcomingPaymentId: upcomingPayment.id,
  };
}

/** Borra todo lo del usuario respetando el orden de las restricciones. */
export async function deleteTestUser(userId: string): Promise<void> {
  const db = getDb();
  await db.ledgerEntry.deleteMany({ where: { userId } });
  await db.upcomingPayment.deleteMany({ where: { userId } });
  await db.transaction.updateMany({ where: { userId }, data: { correctedFromId: null } });
  await db.transaction.deleteMany({ where: { userId } });
  await db.investment.deleteMany({ where: { userId } });
  await db.account.deleteMany({ where: { userId } });
  await db.category.deleteMany({ where: { userId } });
  await db.session.deleteMany({ where: { userId } });
  await db.authToken.deleteMany({ where: { userId } });
  await db.authEvent.deleteMany({ where: { userId } });
  await db.user.delete({ where: { id: userId } });
}

/** FormData al estilo de los formularios de la aplicación. */
export function formData(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.append(key, value);
  return data;
}
