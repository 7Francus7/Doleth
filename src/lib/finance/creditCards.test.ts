import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { FIXTURE_MOVEMENT_DAY, createTestUser, deleteTestUser, formData, hasDatabase, type TestUser } from "../../test/fixtures";
import { accountsMoneyCents, debtCents, patrimonyCents } from "./projection";

/**
 * Tarjetas de crédito, contra una base real.
 *
 * Todo este archivo prueba una sola afirmación desde distintos ángulos: gastar
 * con una tarjeta **no saca plata de ninguna cuenta**. La plata sale el día que
 * se paga el resumen. Un producto que se equivoca acá le dice a la persona que
 * tiene menos de lo que tiene, y después le vuelve a descontar lo mismo cuando
 * paga.
 */

const currentUserId = { value: "" };

vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));

vi.mock("../auth/guards", async () => {
  const actual = await vi.importActual<typeof import("../auth/guards")>("../auth/guards");
  const { getDb } = await import("../db");
  return {
    ...actual,
    requireOnboardedUserForAction: async () => {
      if (!currentUserId.value) throw new actual.UnauthorizedError();
      return getDb().user.findUniqueOrThrow({ where: { id: currentUserId.value } });
    },
  };
});

const { createAccountAction, createMovementAction } = await import("../../app/actions/finance");
const { getAccountsWithBalances } = await import("./data");
const { getNowModel } = await import("../../features/now/data/getNowModel");
const { getDb } = await import("../db");

const idle = { ok: false, message: "" };

/** Las cuentas tal como las consume el cálculo puro. */
const projectionAccounts = async (userId: string) =>
  (await getAccountsWithBalances(userId)).map((account) => ({
    id: account.id,
    name: account.name,
    balanceCents: account.balanceCents,
    archived: account.status === "ARCHIVED",
    liability: account.liability,
  }));

describe.skipIf(!hasDatabase)("tarjetas de crédito", () => {
  let usuario: TestUser;
  let banco: string;
  let visa: string;

  beforeAll(async () => {
    usuario = await createTestUser("tarjetas");
    currentUserId.value = usuario.id;
    banco = usuario.accountId;

    const creada = await createAccountAction(
      idle,
      formData({
        name: "Visa Galicia",
        type: "CREDIT_CARD",
        currency: "ARS",
        initialBalance: "0",
        closingDay: "20",
        dueDay: "10",
        last4: "4321",
      }),
    );
    expect(creada.ok).toBe(true);
    visa = (await getDb().account.findFirstOrThrow({ where: { userId: usuario.id, type: "CREDIT_CARD" } })).id;
  });

  afterAll(async () => {
    await getDb().creditCard.deleteMany({ where: { userId: usuario.id } });
    await deleteTestUser(usuario.id);
  });

  describe("alta", () => {
    it("crea la cuenta y su tarjeta en una sola operación", async () => {
      const card = await getDb().creditCard.findFirstOrThrow({ where: { userId: usuario.id } });
      expect(card.accountId).toBe(visa);
      expect(card.closingDay).toBe(20);
      expect(card.dueDay).toBe(10);
      expect(card.last4).toBe("4321");
    });

    /**
     * Sin día de cierre, la tarjeta no responde la única pregunta por la que
     * existe como entidad aparte: cuándo hay que pagarla. No puede quedar a
     * medias.
     */
    it("no deja crear una tarjeta sin sus fechas", async () => {
      const result = await createAccountAction(
        idle,
        formData({ name: "Master", type: "CREDIT_CARD", currency: "ARS", initialBalance: "0" }),
      );
      expect(result.ok).toBe(false);
      expect(result.error?.code).toBe("closing-day-invalid");
    });

    it("rechaza un día que no existe en el calendario", async () => {
      const result = await createAccountAction(
        idle,
        formData({
          name: "Master",
          type: "CREDIT_CARD",
          currency: "ARS",
          initialBalance: "0",
          closingDay: "45",
          dueDay: "10",
        }),
      );
      expect(result.ok).toBe(false);
      expect(result.error?.field).toBe("closingDay");
    });

    it("rechaza unos últimos dígitos que no son cuatro dígitos", async () => {
      const result = await createAccountAction(
        idle,
        formData({
          name: "Master",
          type: "CREDIT_CARD",
          currency: "ARS",
          initialBalance: "0",
          closingDay: "20",
          dueDay: "10",
          last4: "12",
        }),
      );
      expect(result.ok).toBe(false);
      expect(result.error?.field).toBe("last4");
    });

    it("una cuenta común sigue creándose sin pedir nada de esto", async () => {
      const result = await createAccountAction(
        idle,
        formData({ name: "Caja chica", type: "CASH", currency: "ARS", initialBalance: "1000" }),
      );
      expect(result.ok).toBe(true);
    });
  });

  describe("gastar con la tarjeta", () => {
    it("no toca el dinero de las cuentas y aumenta la deuda", async () => {
      const antes = await projectionAccounts(usuario.id);
      const dineroAntes = accountsMoneyCents(antes);
      const deudaAntes = debtCents(antes);
      const patrimonioAntes = patrimonyCents(antes);

      const categoria = await getDb().category.findFirstOrThrow({ where: { userId: usuario.id, slug: "food" } });
      const result = await createMovementAction(
        idle,
        formData({
          type: "EXPENSE",
          amount: "240000",
          occurredOn: FIXTURE_MOVEMENT_DAY,
          sourceAccountId: visa,
          categoryId: categoria.id,
          idempotencyKey: randomUUID(),
        }),
      );
      expect(result.ok).toBe(true);

      const despues = await projectionAccounts(usuario.id);
      // La afirmación central: el dinero disponible no se movió ni un centavo.
      expect(accountsMoneyCents(despues)).toBe(dineroAntes);
      expect(debtCents(despues)).toBe(deudaAntes + 24_000_000n);
      // Y el patrimonio sí bajó, porque ahora se debe más.
      expect(patrimonyCents(despues)).toBe(patrimonioAntes - 24_000_000n);
    });

    /**
     * Pagar el resumen es una transferencia del banco a la tarjeta: ahí sí sale
     * la plata, y ahí sí baja la deuda. Que sea el mismo mecanismo de siempre no
     * es casualidad: una tarjeta es una cuenta del ledger, no un caso especial.
     */
    it("pagar el resumen saca la plata del banco y cancela la deuda", async () => {
      const antes = await projectionAccounts(usuario.id);
      const dineroAntes = accountsMoneyCents(antes);
      const deudaAntes = debtCents(antes);
      const patrimonioAntes = patrimonyCents(antes);

      const result = await createMovementAction(
        idle,
        formData({
          type: "TRANSFER",
          amount: "240000",
          occurredOn: FIXTURE_MOVEMENT_DAY,
          sourceAccountId: banco,
          destinationAccountId: visa,
          idempotencyKey: randomUUID(),
        }),
      );
      expect(result.ok).toBe(true);

      const despues = await projectionAccounts(usuario.id);
      expect(accountsMoneyCents(despues)).toBe(dineroAntes - 24_000_000n);
      expect(debtCents(despues)).toBe(deudaAntes - 24_000_000n);
      // El patrimonio no cambia al pagar: se cambió plata por menos deuda.
      expect(patrimonyCents(despues)).toBe(patrimonioAntes);
    });
  });

  describe("la pantalla", () => {
    it("nombra la deuda en vez de dejarla implícita en el patrimonio", async () => {
      const categoria = await getDb().category.findFirstOrThrow({ where: { userId: usuario.id, slug: "food" } });
      await createMovementAction(
        idle,
        formData({
          type: "EXPENSE",
          amount: "50000",
          occurredOn: FIXTURE_MOVEMENT_DAY,
          sourceAccountId: visa,
          categoryId: categoria.id,
          idempotencyKey: randomUUID(),
        }),
      );

      const model = await getNowModel(usuario.id);
      expect(model.information.causalLine).toContain("Debés");
      expect(model.information.causalLine).toContain("no saca plata de tus cuentas");
      expect(model.evidence?.summary).toContain("no descuenta");
    });

    it("la tarjeta aparece con su nombre de tipo propio", async () => {
      const model = await getNowModel(usuario.id);
      expect(model.accounts?.find((cuenta) => cuenta.id === visa)?.type).toBe("Tarjeta de crédito");
    });
  });
});
