import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getDb } from "../db";
import {
  getAccountsWithBalances,
  getDashboardData,
  getInvestments,
  getMovementFormData,
  getMovements,
  getOwnedMovement,
  getOwnedUpcomingPayment,
  getUpcomingPayments,
} from "./data";
import { createTestUser, deleteTestUser, hasDatabase, type TestUser } from "../../test/fixtures";

/**
 * Aislamiento de la capa de lectura.
 *
 * Estas pruebas son bloqueantes: si alguna falla, la aplicación deja escapar
 * datos de una persona a otra. Necesitan una base real, así que la suite requiere
 * DATABASE_URL (o TEST_DATABASE_URL) apuntando a un Postgres de pruebas.
 */
describe.skipIf(!hasDatabase)("aislamiento de datos entre usuarios · lectura", () => {
  let alicia: TestUser;
  let bruno: TestUser;

  beforeAll(async () => {
    alicia = await createTestUser("alicia");
    bruno = await createTestUser("bruno");
  });

  afterAll(async () => {
    await deleteTestUser(alicia.id);
    await deleteTestUser(bruno.id);
  });

  it("cada usuario ve únicamente sus cuentas", async () => {
    const cuentas = await getAccountsWithBalances(alicia.id);
    expect(cuentas).toHaveLength(2);
    expect(cuentas.map((cuenta) => cuenta.id)).not.toContain(bruno.accountId);
    expect(cuentas.every((cuenta) => cuenta.name.includes("alicia"))).toBe(true);
  });

  it("los saldos no incluyen asientos de otro usuario", async () => {
    const [deAlicia, deBruno] = await Promise.all([
      getAccountsWithBalances(alicia.id),
      getAccountsWithBalances(bruno.id),
    ]);
    const cuentaAlicia = deAlicia.find((cuenta) => cuenta.id === alicia.accountId);
    const cuentaBruno = deBruno.find((cuenta) => cuenta.id === bruno.accountId);
    // 100.000 de saldo inicial menos el gasto de 12.345, para cada uno por separado.
    expect(cuentaAlicia?.balanceCents).toBe(87_655n);
    expect(cuentaBruno?.balanceCents).toBe(87_655n);
  });

  it("el historial de movimientos no cruza usuarios", async () => {
    const { movements, accounts } = await getMovements(alicia.id, { month: "2026-07" });
    expect(movements.map((movimiento) => movimiento.id)).toContain(alicia.transactionId);
    expect(movements.map((movimiento) => movimiento.id)).not.toContain(bruno.transactionId);
    expect(accounts.map((cuenta) => cuenta.id)).not.toContain(bruno.accountId);
  });

  it("filtrar por una cuenta ajena no devuelve nada", async () => {
    const { movements } = await getMovements(alicia.id, { month: "2026-07", accountId: bruno.accountId });
    expect(movements).toHaveLength(0);
  });

  it("un movimiento ajeno no se puede leer por id", async () => {
    expect(await getOwnedMovement(alicia.id, bruno.transactionId)).toBeNull();
    expect(await getOwnedMovement(alicia.id, alicia.transactionId)).not.toBeNull();
  });

  it("un próximo pago ajeno no se puede leer por id", async () => {
    expect(await getOwnedUpcomingPayment(alicia.id, bruno.upcomingPaymentId)).toBeNull();
    expect(await getOwnedUpcomingPayment(alicia.id, alicia.upcomingPaymentId)).not.toBeNull();
  });

  it("las inversiones no cruzan usuarios", async () => {
    const inversiones = await getInvestments(alicia.id);
    expect(inversiones.map((inversion) => inversion.id)).toEqual([alicia.investmentId]);
  });

  it("los próximos pagos no cruzan usuarios", async () => {
    const { payments } = await getUpcomingPayments(alicia.id);
    expect(payments.map((pago) => pago.id)).toEqual([alicia.upcomingPaymentId]);
  });

  it("las opciones del formulario sólo ofrecen recursos propios", async () => {
    const datos = await getMovementFormData(alicia.id);
    expect(datos.accounts.map((cuenta) => cuenta.id)).not.toContain(bruno.accountId);
    expect(datos.categories.map((categoria) => categoria.id)).not.toContain(bruno.categoryId);
    expect(datos.categories.length).toBeGreaterThan(0);
  });

  it("el panel resume sólo el patrimonio propio", async () => {
    const panel = await getDashboardData(alicia.id);
    // Dos cuentas: 100.000 + 50.000 de saldo inicial, menos el gasto de 12.345.
    expect(panel.totalCents).toBe(137_655n);
    expect(panel.accounts).toHaveLength(2);
    expect(panel.recent.map((movimiento) => movimiento.id)).not.toContain(bruno.transactionId);
    expect(panel.upcoming.every((pago) => pago.concept.includes("alicia"))).toBe(true);
  });

  it("un usuario nuevo arranca sin ningún dato heredado", async () => {
    const nuevo = await getDb().user.create({
      data: {
        name: "Recién llegada",
        email: `nueva-${Date.now()}@pruebas.doleth.local`,
        passwordHash: "scrypt$65536$8$2$c2FsdGVzdA$aGFzaGRlcHJ1ZWJhbm9zaXJ2ZXBhcmFuYWRhMDA",
        status: "ACTIVE",
      },
    });
    try {
      expect(await getAccountsWithBalances(nuevo.id)).toHaveLength(0);
      expect((await getMovements(nuevo.id, { month: "2026-07" })).movements).toHaveLength(0);
      expect(await getInvestments(nuevo.id)).toHaveLength(0);
      expect((await getUpcomingPayments(nuevo.id)).payments).toHaveLength(0);
      expect((await getDashboardData(nuevo.id)).totalCents).toBe(0n);
    } finally {
      await deleteTestUser(nuevo.id);
    }
  });

  it("PostgreSQL rechaza referencias financieras con propietarios cruzados", async () => {
    const key = `cross-owner-${Date.now()}`;

    await expect(
      getDb().transaction.create({
        data: {
          userId: alicia.id,
          type: "EXPENSE",
          amountCents: 100n,
          occurredOn: new Date("2026-07-20T00:00:00.000Z"),
          sourceAccountId: bruno.accountId,
          categoryId: alicia.categoryId,
          idempotencyKey: key,
        },
      }),
    ).rejects.toMatchObject({ code: "P2003" });

    expect(await getDb().transaction.count({ where: { idempotencyKey: key } })).toBe(0);

    await expect(
      getDb().transaction.create({
        data: {
          userId: alicia.id,
          type: "EXPENSE",
          amountCents: 100n,
          occurredOn: new Date("2026-07-20T00:00:00.000Z"),
          sourceAccountId: alicia.accountId,
          categoryId: bruno.categoryId,
          idempotencyKey: `${key}-category`,
        },
      }),
    ).rejects.toMatchObject({ code: "P2003" });

    await expect(
      getDb().ledgerEntry.create({
        data: {
          userId: alicia.id,
          transactionId: alicia.transactionId,
          accountId: bruno.accountId,
          amountCents: -100n,
        },
      }),
    ).rejects.toMatchObject({ code: "P2003" });

    await expect(
      getDb().upcomingPayment.create({
        data: {
          userId: alicia.id,
          concept: "Referencia cruzada",
          estimatedCents: 100n,
          dueOn: new Date("2026-08-01T00:00:00.000Z"),
          plannedAccountId: bruno.accountId,
        },
      }),
    ).rejects.toMatchObject({ code: "P2003" });

    await expect(
      getDb().transaction.update({
        where: { id: alicia.transactionId },
        data: { sourceAccountId: bruno.accountId },
      }),
    ).rejects.toMatchObject({ code: "P2003" });

    expect((await getDb().transaction.findUniqueOrThrow({ where: { id: alicia.transactionId } })).sourceAccountId)
      .toBe(alicia.accountId);
  });
});
