import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { UnauthorizedError } from "../../lib/auth/guards";
import { createTestUser, deleteTestUser, formData, hasDatabase, type TestUser } from "../../test/fixtures";
import type { FinanceActionState } from "./finance";

/** Estado inicial de `useActionState`: la acción no lee nada de él. */
const NO_PREVIOUS_STATE: FinanceActionState = { ok: false, message: "" };

/**
 * Autorización de las Server Actions financieras.
 *
 * Se sustituye únicamente la guardia de sesión (que en producción lee la cookie y
 * la tabla `Session`); todo lo demás —validación, consultas, escrituras— corre de
 * verdad contra Postgres. Así se comprueba lo que importa: que el propietario
 * salga de la sesión y que ningún id del formulario alcance para tocar datos
 * ajenos.
 *
 * Pruebas bloqueantes.
 */

const currentUserId = { value: "" };

vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));

vi.mock("../../lib/auth/guards", async () => {
  const actual = await vi.importActual<typeof import("../../lib/auth/guards")>("../../lib/auth/guards");
  const { getDb } = await import("../../lib/db");
  return {
    ...actual,
    requireOnboardedUserForAction: async () => {
      if (!currentUserId.value) throw new actual.UnauthorizedError();
      return getDb().user.findUniqueOrThrow({ where: { id: currentUserId.value } });
    },
  };
});

const {
  archiveInvestmentAction,
  correctMovementAction,
  createAccountAction,
  createMovementAction,
  createUpcomingPaymentAction,
  payUpcomingPaymentAction,
  setAccountStatusAction,
  voidMovementAction,
} = await import("./finance");
const { getDb } = await import("../../lib/db");

const idle = { ok: false, message: "" };

describe.skipIf(!hasDatabase)("autorización de las acciones financieras", () => {
  let alicia: TestUser;
  let bruno: TestUser;

  beforeAll(async () => {
    alicia = await createTestUser("alicia-w");
    bruno = await createTestUser("bruno-w");
  });

  afterAll(async () => {
    await deleteTestUser(alicia.id);
    await deleteTestUser(bruno.id);
  });

  beforeEach(() => {
    currentUserId.value = alicia.id;
  });

  describe("sin sesión", () => {
    beforeEach(() => {
      currentUserId.value = "";
    });

    it("las acciones con estado devuelven un error de sesión, no ejecutan nada", async () => {
      const antes = await getDb().account.count();
      const resultado = await createAccountAction(
        idle,
        formData({ name: "Colada", type: "BANK", currency: "ARS", initialBalance: "1000" }),
      );
      expect(resultado.ok).toBe(false);
      expect(resultado.message).toMatch(/sesión/i);
      expect(await getDb().account.count()).toBe(antes);
    });

    it("las acciones sin estado lanzan UnauthorizedError", async () => {
      await expect(setAccountStatusAction(formData({ id: alicia.accountId, status: "ARCHIVED" }))).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it("anular sin sesión devuelve un error de autorización, no uno genérico", async () => {
      // `voidMovementAction` devuelve estado tipado en vez de lanzar: el
      // formulario muestra el error sin una navegación sorpresiva. Lo que no
      // puede pasar es que la falta de sesión se confunda con otra falla.
      const resultado = await voidMovementAction(
        NO_PREVIOUS_STATE,
        formData({ id: alicia.transactionId, reason: "prueba sin sesión" }),
      );
      expect(resultado.ok).toBe(false);
      expect(resultado.error?.code).toBe("unauthorized");

      const intacto = await getDb().transaction.findUniqueOrThrow({ where: { id: alicia.transactionId } });
      expect(intacto.voidedAt).toBeNull();
    });
  });

  it("no puede archivar una cuenta ajena", async () => {
    await expect(setAccountStatusAction(formData({ id: bruno.accountId, status: "ARCHIVED" }))).rejects.toThrow(
      /inexistente/i,
    );
    const cuenta = await getDb().account.findUniqueOrThrow({ where: { id: bruno.accountId } });
    expect(cuenta.status).toBe("ACTIVE");
  });

  it("no puede crear un movimiento sobre una cuenta ajena", async () => {
    const resultado = await createMovementAction(
      idle,
      formData({
        type: "EXPENSE",
        amount: "500",
        occurredOn: "2026-07-15",
        sourceAccountId: bruno.accountId,
        categoryId: alicia.categoryId,
        idempotencyKey: randomUUID(),
      }),
    );
    expect(resultado.ok).toBe(false);
    expect(await getDb().transaction.count({ where: { sourceAccountId: bruno.accountId } })).toBe(1);
  });

  it("no puede usar una categoría ajena", async () => {
    const resultado = await createMovementAction(
      idle,
      formData({
        type: "EXPENSE",
        amount: "500",
        occurredOn: "2026-07-15",
        sourceAccountId: alicia.accountId,
        categoryId: bruno.categoryId,
        idempotencyKey: randomUUID(),
      }),
    );
    expect(resultado.ok).toBe(false);
    expect(resultado.message).toMatch(/categoría/i);
  });

  it("no puede transferir hacia una cuenta ajena", async () => {
    const resultado = await createMovementAction(
      idle,
      formData({
        type: "TRANSFER",
        amount: "1000",
        occurredOn: "2026-07-15",
        sourceAccountId: alicia.accountId,
        destinationAccountId: bruno.accountId,
        idempotencyKey: randomUUID(),
      }),
    );
    expect(resultado.ok).toBe(false);
    expect(await getDb().ledgerEntry.count({ where: { accountId: bruno.accountId } })).toBe(1);
  });

  it("no puede transferir desde una cuenta ajena", async () => {
    const resultado = await createMovementAction(
      idle,
      formData({
        type: "TRANSFER",
        amount: "1000",
        occurredOn: "2026-07-15",
        sourceAccountId: bruno.accountId,
        destinationAccountId: alicia.accountId,
        idempotencyKey: randomUUID(),
      }),
    );
    expect(resultado.ok).toBe(false);
  });

  it("sí puede transferir entre dos cuentas propias", async () => {
    const resultado = await createMovementAction(
      idle,
      formData({
        type: "TRANSFER",
        amount: "1000",
        occurredOn: "2026-07-15",
        sourceAccountId: alicia.accountId,
        destinationAccountId: alicia.secondAccountId,
        idempotencyKey: randomUUID(),
      }),
    );
    expect(resultado.ok).toBe(true);
  });

  it("no puede anular un movimiento ajeno", async () => {
    const resultado = await voidMovementAction(
      NO_PREVIOUS_STATE,
      formData({ id: bruno.transactionId, reason: "intento de anulación cruzada" }),
    );
    // Un id ajeno responde exactamente lo mismo que uno inexistente: no se
    // confirma que ese movimiento exista, y sobre todo no se anula.
    expect(resultado.ok).toBe(false);
    expect(resultado.error?.code).toBe("movement-missing");

    const movimiento = await getDb().transaction.findUniqueOrThrow({ where: { id: bruno.transactionId } });
    expect(movimiento.voidedAt).toBeNull();
  });

  it("no puede corregir un movimiento ajeno", async () => {
    const resultado = await correctMovementAction(
      idle,
      formData({
        originalId: bruno.transactionId,
        type: "EXPENSE",
        amount: "999",
        occurredOn: "2026-07-15",
        sourceAccountId: alicia.accountId,
        categoryId: alicia.categoryId,
        idempotencyKey: randomUUID(),
      }),
    );
    expect(resultado.ok).toBe(false);
    const movimiento = await getDb().transaction.findUniqueOrThrow({ where: { id: bruno.transactionId } });
    expect(movimiento.voidedAt).toBeNull();
    expect(movimiento.amountCents).toBe(12_345n);
  });

  it("no puede archivar una inversión ajena", async () => {
    await expect(
      archiveInvestmentAction(formData({ id: bruno.investmentId, status: "ARCHIVED" })),
    ).rejects.toThrow(/inexistente/i);
    const inversion = await getDb().investment.findUniqueOrThrow({ where: { id: bruno.investmentId } });
    expect(inversion.status).toBe("ACTIVE");
  });

  it("no puede planificar un pago sobre una cuenta ajena", async () => {
    const resultado = await createUpcomingPaymentAction(
      idle,
      formData({
        concept: "Pago cruzado",
        amount: "5000",
        dueOn: "2026-08-01",
        plannedAccountId: bruno.accountId,
      }),
    );
    expect(resultado.ok).toBe(false);
    expect(await getDb().upcomingPayment.count({ where: { concept: "Pago cruzado" } })).toBe(0);
  });

  it("no puede convertir en gasto un próximo pago ajeno", async () => {
    const resultado = await payUpcomingPaymentAction(
      idle,
      formData({ paymentId: bruno.upcomingPaymentId, occurredOn: "2026-07-20" }),
    );
    expect(resultado.ok).toBe(false);
    const pago = await getDb().upcomingPayment.findUniqueOrThrow({ where: { id: bruno.upcomingPaymentId } });
    expect(pago.status).toBe("PENDING");
    expect(pago.transactionId).toBeNull();
  });

  it("todo lo que escribe queda con el propietario de la sesión", async () => {
    const resultado = await createAccountAction(
      idle,
      formData({ name: "Cuenta nueva", type: "CASH", currency: "ARS", initialBalance: "2500" }),
    );
    expect(resultado.ok).toBe(true);
    const cuenta = await getDb().account.findFirstOrThrow({
      where: { name: "Cuenta nueva" },
      orderBy: { createdAt: "desc" },
    });
    expect(cuenta.userId).toBe(alicia.id);
  });

  it("los asientos del ledger también guardan el propietario", async () => {
    const clave = randomUUID();
    await createMovementAction(
      idle,
      formData({
        type: "INCOME",
        amount: "7500",
        occurredOn: "2026-07-16",
        sourceAccountId: alicia.accountId,
        categoryId: (await getDb().category.findFirstOrThrow({ where: { userId: alicia.id, slug: "salary" } })).id,
        idempotencyKey: clave,
      }),
    );
    const movimiento = await getDb().transaction.findFirstOrThrow({
      where: { userId: alicia.id, idempotencyKey: clave },
      include: { entries: true },
    });
    expect(movimiento.entries.length).toBeGreaterThan(0);
    expect(movimiento.entries.every((asiento) => asiento.userId === alicia.id)).toBe(true);
  });

  it("la clave de idempotencia es por usuario: la misma clave no colisiona entre cuentas", async () => {
    const clave = `compartida-${randomUUID()}`;
    const campos = (usuario: TestUser) => ({
      type: "EXPENSE",
      amount: "100",
      occurredOn: "2026-07-17",
      sourceAccountId: usuario.accountId,
      categoryId: usuario.categoryId,
      idempotencyKey: clave,
    });

    currentUserId.value = alicia.id;
    expect((await createMovementAction(idle, formData(campos(alicia)))).ok).toBe(true);

    currentUserId.value = bruno.id;
    expect((await createMovementAction(idle, formData(campos(bruno)))).ok).toBe(true);

    expect(await getDb().transaction.count({ where: { idempotencyKey: clave } })).toBe(2);
  });

  it("repetir la clave dentro del mismo usuario no duplica el movimiento", async () => {
    const clave = `repetida-${randomUUID()}`;
    const campos = {
      type: "EXPENSE",
      amount: "250",
      occurredOn: "2026-07-18",
      sourceAccountId: alicia.accountId,
      categoryId: alicia.categoryId,
      idempotencyKey: clave,
    };
    expect((await createMovementAction(idle, formData(campos))).ok).toBe(true);
    expect((await createMovementAction(idle, formData(campos))).ok).toBe(true);
    expect(await getDb().transaction.count({ where: { userId: alicia.id, idempotencyKey: clave } })).toBe(1);
  });
});
