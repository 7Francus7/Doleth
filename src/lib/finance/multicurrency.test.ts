import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { FIXTURE_MOVEMENT_DAY, createTestUser, deleteTestUser, formData, hasDatabase, type TestUser } from "../../test/fixtures";
import { RATE_SCALE, money } from "./currency";
import { valuate, type RateBook } from "./valuation";

/**
 * El camino multimoneda completo, contra una base real.
 *
 * Hasta la fundación multimoneda las acciones rechazaban toda cuenta que no
 * fuera en pesos. Estas pruebas verifican las dos mitades de haber levantado esa
 * restricción: que ahora se puede operar en dólares, y que el ledger sigue
 * cerrando cuando un solo movimiento toca dos monedas a la vez.
 *
 * Se ejercitan las acciones reales, no una simulación: el valor de la prueba
 * está justamente en pasar por las restricciones de la base.
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

const { correctMovementAction, createAccountAction, createInvestmentAction, createMovementAction, voidMovementAction } =
  await import("../../app/actions/finance");
const { getAccountsWithBalances } = await import("./data");
const { getDb } = await import("../db");

const idle = { ok: false, message: "" };

const balanceOf = async (userId: string, accountId: string) =>
  (await getAccountsWithBalances(userId)).find((account) => account.id === accountId)!.balanceCents;

describe.skipIf(!hasDatabase)("ledger multimoneda", () => {
  let usuario: TestUser;
  /** Cuenta en dólares, creada por la acción real y no sembrada a mano. */
  let dolares: string;
  let pesos: string;

  beforeAll(async () => {
    usuario = await createTestUser("multimoneda");
    currentUserId.value = usuario.id;
    pesos = usuario.accountId;

    const creada = await createAccountAction(
      idle,
      formData({ name: "Colchón", type: "CASH", currency: "USD", initialBalance: "1000" }),
    );
    expect(creada.ok).toBe(true);
    dolares = (await getDb().account.findFirstOrThrow({ where: { userId: usuario.id, currency: "USD" } })).id;
  });

  afterAll(async () => {
    await deleteTestUser(usuario.id);
  });

  describe("cuentas e inversiones en otra moneda", () => {
    it("una cuenta en dólares guarda su saldo en dólares", async () => {
      const cuenta = (await getAccountsWithBalances(usuario.id)).find((account) => account.id === dolares)!;
      expect(cuenta.currency).toBe("USD");
      expect(cuenta.balanceCents).toBe(100_000n);
    });

    it("una inversión puede estar en dólares", async () => {
      const result = await createInvestmentAction(
        idle,
        formData({ name: "Bonos", kind: "BOND", currency: "USD", invested: "500", currentValue: "540" }),
      );
      expect(result.ok).toBe(true);
      const inversion = await getDb().investment.findFirstOrThrow({
        where: { userId: usuario.id, name: "Bonos" },
      });
      expect(inversion.currency).toBe("USD");
    });

    /**
     * Guardar una moneda que después no se puede cotizar dejaría un agujero
     * permanente en el patrimonio de esa persona: la valuación la declararía como
     * faltante para siempre y no habría forma de resolverla desde la interfaz.
     */
    it("una moneda que Doleth no sabe cotizar se rechaza al crear la cuenta", async () => {
      const result = await createAccountAction(
        idle,
        formData({ name: "Cripto", type: "OTHER", currency: "BTC", initialBalance: "1" }),
      );
      expect(result.ok).toBe(false);
      expect(result.error?.code).toBe("currency-unsupported");
      expect(result.message).toContain("BTC");
    });
  });

  describe("movimientos en una sola moneda", () => {
    it("un gasto hereda la moneda de su cuenta de origen", async () => {
      const categoria = await getDb().category.findFirstOrThrow({ where: { userId: usuario.id, slug: "food" } });
      const clave = randomUUID();
      const result = await createMovementAction(
        idle,
        formData({
          type: "EXPENSE",
          amount: "50",
          occurredOn: FIXTURE_MOVEMENT_DAY,
          sourceAccountId: dolares,
          categoryId: categoria.id,
          idempotencyKey: clave,
        }),
      );
      expect(result.ok).toBe(true);

      const movimiento = await getDb().transaction.findFirstOrThrow({
        where: { userId: usuario.id, idempotencyKey: clave },
      });
      expect(movimiento.currency).toBe("USD");
      expect(movimiento.destinationAmountCents).toBeNull();
      expect(await balanceOf(usuario.id, dolares)).toBe(95_000n);
    });

    it("entre cuentas de la misma moneda no se pide un importe de destino", async () => {
      const otraEnPesos = await getDb().account.create({
        data: { userId: usuario.id, name: "Segunda en pesos", type: "BANK", initialBalanceCents: 0n },
      });
      const result = await createMovementAction(
        idle,
        formData({
          type: "TRANSFER",
          amount: "100",
          occurredOn: FIXTURE_MOVEMENT_DAY,
          sourceAccountId: pesos,
          destinationAccountId: otraEnPesos.id,
          idempotencyKey: randomUUID(),
        }),
      );
      expect(result.ok).toBe(true);
      expect(await balanceOf(usuario.id, otraEnPesos.id)).toBe(10_000n);
    });

    it("mandar un importe de destino donde no corresponde se rechaza", async () => {
      const otraEnPesos = await getDb().account.findFirstOrThrow({
        where: { userId: usuario.id, name: "Segunda en pesos" },
      });
      const result = await createMovementAction(
        idle,
        formData({
          type: "TRANSFER",
          amount: "100",
          occurredOn: FIXTURE_MOVEMENT_DAY,
          sourceAccountId: pesos,
          destinationAccountId: otraEnPesos.id,
          destinationAmount: "90",
          idempotencyKey: randomUUID(),
        }),
      );
      expect(result.ok).toBe(false);
      expect(result.error?.code).toBe("destination-amount-unexpected");
    });
  });

  describe("transferencia que cruza monedas", () => {
    /**
     * El caso que define el corte: salen pesos y entran dólares. Cada asiento
     * queda en la moneda de su cuenta, así que el saldo de cada una sigue siendo
     * legible por sí solo, sin arrastrar una cotización adentro.
     */
    it("descuenta pesos y acredita dólares", async () => {
      const pesosAntes = await balanceOf(usuario.id, pesos);
      const dolaresAntes = await balanceOf(usuario.id, dolares);
      const clave = randomUUID();

      const result = await createMovementAction(
        idle,
        formData({
          type: "TRANSFER",
          amount: "140000",
          destinationAmount: "100",
          occurredOn: FIXTURE_MOVEMENT_DAY,
          sourceAccountId: pesos,
          destinationAccountId: dolares,
          idempotencyKey: clave,
        }),
      );
      expect(result.ok).toBe(true);

      const movimiento = await getDb().transaction.findFirstOrThrow({
        where: { userId: usuario.id, idempotencyKey: clave },
      });
      expect(movimiento.currency).toBe("ARS");
      expect(movimiento.amountCents).toBe(14_000_000n);
      expect(movimiento.destinationAmountCents).toBe(10_000n);

      expect(await balanceOf(usuario.id, pesos)).toBe(pesosAntes - 14_000_000n);
      expect(await balanceOf(usuario.id, dolares)).toBe(dolaresAntes + 10_000n);
    });

    /**
     * Doleth pide el importe acreditado en vez de calcularlo con la cotización
     * del día: el precio que le hicieron a esa persona es un hecho de esa
     * operación, no el promedio del mercado.
     */
    it("sin el importe acreditado, no adivina la cotización", async () => {
      const result = await createMovementAction(
        idle,
        formData({
          type: "TRANSFER",
          amount: "140000",
          occurredOn: FIXTURE_MOVEMENT_DAY,
          sourceAccountId: pesos,
          destinationAccountId: dolares,
          idempotencyKey: randomUUID(),
        }),
      );
      expect(result.ok).toBe(false);
      expect(result.error?.code).toBe("destination-amount-required");
      expect(result.error?.field).toBe("destinationAmount");
      expect(result.message).toContain("dólares");
    });

    it("anular devuelve cada cuenta a su moneda y su saldo", async () => {
      const pesosAntes = await balanceOf(usuario.id, pesos);
      const dolaresAntes = await balanceOf(usuario.id, dolares);
      const clave = randomUUID();

      await createMovementAction(
        idle,
        formData({
          type: "TRANSFER",
          amount: "70000",
          destinationAmount: "50",
          occurredOn: FIXTURE_MOVEMENT_DAY,
          sourceAccountId: pesos,
          destinationAccountId: dolares,
          idempotencyKey: clave,
        }),
      );
      const movimiento = await getDb().transaction.findFirstOrThrow({
        where: { userId: usuario.id, idempotencyKey: clave },
      });

      const anulacion = await voidMovementAction(idle, formData({ id: movimiento.id, reason: "cargado por error" }));
      expect(anulacion.ok).toBe(true);
      expect(await balanceOf(usuario.id, pesos)).toBe(pesosAntes);
      expect(await balanceOf(usuario.id, dolares)).toBe(dolaresAntes);
    });

    it("corregir el importe acreditado reemplaza los dos asientos", async () => {
      const pesosAntes = await balanceOf(usuario.id, pesos);
      const dolaresAntes = await balanceOf(usuario.id, dolares);

      await createMovementAction(
        idle,
        formData({
          type: "TRANSFER",
          amount: "140000",
          destinationAmount: "100",
          occurredOn: FIXTURE_MOVEMENT_DAY,
          sourceAccountId: pesos,
          destinationAccountId: dolares,
          idempotencyKey: randomUUID(),
        }),
      );
      const original = await getDb().transaction.findFirstOrThrow({
        where: { userId: usuario.id, type: "TRANSFER", voidedAt: null, destinationAmountCents: 10_000n },
        orderBy: { createdAt: "desc" },
      });

      // El cambio real fue a 1.500 por dólar: entraron 93,33 y no 100.
      const correccion = await correctMovementAction(
        idle,
        formData({
          originalId: original.id,
          type: "TRANSFER",
          amount: "140000",
          destinationAmount: "93,33",
          occurredOn: FIXTURE_MOVEMENT_DAY,
          sourceAccountId: pesos,
          destinationAccountId: dolares,
          idempotencyKey: randomUUID(),
        }),
      );
      expect(correccion.ok).toBe(true);

      expect(await balanceOf(usuario.id, pesos)).toBe(pesosAntes - 14_000_000n);
      expect(await balanceOf(usuario.id, dolares)).toBe(dolaresAntes + 9_333n);
    });
  });

  describe("patrimonio consolidado", () => {
    const book = (rateMicros: bigint): RateBook => ({
      rates: [
        {
          base: "USD",
          quote: "ARS",
          rateMicros,
          variant: "BLUE",
          asOf: new Date(),
          provider: "prueba",
        },
      ],
    });

    it("valúa las dos monedas contra una cotización", async () => {
      const cuentas = await getAccountsWithBalances(usuario.id);
      const importes = cuentas.map((cuenta) => money(cuenta.balanceCents, cuenta.currency as "ARS" | "USD"));

      const enPesos = valuate(importes, "ARS", book(1_400n * RATE_SCALE));
      expect(enPesos.complete).toBe(true);

      // El mismo patrimonio leído en dólares tiene que dar lo mismo dividido.
      const enDolares = valuate(importes, "USD", book(1_400n * RATE_SCALE));
      expect(enDolares.complete).toBe(true);
      expect(enDolares.totalCents).toBeGreaterThan(0n);
    });

    /**
     * La invariante que protege al usuario: sin cotización, sus dólares no
     * desaparecen del patrimonio convertidos en cero. Quedan declarados aparte
     * para que la pantalla tenga que decirlo.
     */
    it("sin cotización, los dólares se declaran en vez de contarse como cero", async () => {
      const cuentas = await getAccountsWithBalances(usuario.id);
      const importes = cuentas.map((cuenta) => money(cuenta.balanceCents, cuenta.currency as "ARS" | "USD"));
      const soloPesos = cuentas
        .filter((cuenta) => cuenta.currency === "ARS")
        .reduce((suma, cuenta) => suma + cuenta.balanceCents, 0n);

      const result = valuate(importes, "ARS", { rates: [] });
      expect(result.totalCents).toBe(soloPesos);
      expect(result.complete).toBe(false);
      expect(result.missing.map((hueco) => hueco.currency)).toEqual(["USD"]);
    });
  });
});
