import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createTestUser, deleteTestUser, formData, hasDatabase, type TestUser } from "../../../test/fixtures";
import { RATE_SCALE } from "../../../lib/finance/currency";

/**
 * Preferencias de lectura de la moneda.
 *
 * Lo que se prueba acá, además de que guarde, es lo que **no** hace: cambiar de
 * pesos a dólares no puede tocar un solo importe del ledger. Si lo tocara, nadie
 * debería animarse a probar cómo se ve su patrimonio al oficial, y la
 * funcionalidad entera perdería sentido.
 */

const currentUserId = { value: "" };

vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));

vi.mock("../../../lib/auth/guards", async () => {
  const actual = await vi.importActual<typeof import("../../../lib/auth/guards")>("../../../lib/auth/guards");
  const { getDb } = await import("../../../lib/db");
  return {
    ...actual,
    requireSessionForAction: async () => {
      if (!currentUserId.value) throw new actual.UnauthorizedError();
      return {
        user: await getDb().user.findUniqueOrThrow({ where: { id: currentUserId.value } }),
        sessionId: "sesion-de-prueba",
      };
    },
  };
});

const { setManualRateAction, updateDisplayPreferencesAction } = await import("./actions");
const { resolveRateBook } = await import("../../../lib/finance/rates/store");
const { getDb } = await import("../../../lib/db");

const idle = { status: "idle" as const, message: "", errors: {} };

describe.skipIf(!hasDatabase)("preferencias de moneda", () => {
  let usuario: TestUser;
  let otro: TestUser;

  beforeAll(async () => {
    usuario = await createTestUser("moneda");
    otro = await createTestUser("moneda-otro");
    currentUserId.value = usuario.id;
  });

  afterAll(async () => {
    await deleteTestUser(usuario.id);
    await deleteTestUser(otro.id);
  });

  afterEach(async () => {
    await getDb().manualRate.deleteMany({ where: { userId: usuario.id } });
  });

  describe("updateDisplayPreferencesAction", () => {
    it("guarda moneda y tipo de cambio juntos", async () => {
      const result = await updateDisplayPreferencesAction(
        idle,
        formData({ displayCurrency: "USD", fxVariant: "MEP" }),
      );
      expect(result.status).toBe("success");

      const book = await resolveRateBook(usuario.id);
      expect(book.displayCurrency).toBe("USD");
      expect(book.variant).toBe("MEP");
    });

    /**
     * La invariante que hace que la función sea segura de tocar: es una lente,
     * no una conversión de datos.
     */
    it("no toca ni un importe del ledger", async () => {
      const antes = await getDb().transaction.findMany({
        where: { userId: usuario.id },
        select: { id: true, amountCents: true, currency: true },
        orderBy: { id: "asc" },
      });

      await updateDisplayPreferencesAction(idle, formData({ displayCurrency: "USD", fxVariant: "BLUE" }));

      const despues = await getDb().transaction.findMany({
        where: { userId: usuario.id },
        select: { id: true, amountCents: true, currency: true },
        orderBy: { id: "asc" },
      });
      expect(despues).toEqual(antes);
    });

    it("rechaza una moneda que el producto no sabe cotizar", async () => {
      const result = await updateDisplayPreferencesAction(
        idle,
        formData({ displayCurrency: "BTC", fxVariant: "BLUE" }),
      );
      expect(result.status).toBe("error");
      expect(result.errors.displayCurrency).toBeDefined();
    });

    it("rechaza un tipo de cambio inventado", async () => {
      const result = await updateDisplayPreferencesAction(
        idle,
        formData({ displayCurrency: "ARS", fxVariant: "PARALELO" }),
      );
      expect(result.status).toBe("error");
      expect(result.errors.fxVariant).toBeDefined();
    });

    /**
     * Elegir "tu cotización" sin haber cargado ninguna dejaría el patrimonio sin
     * poder convertirse, y la persona no tendría forma de saber por qué. Se
     * avisa antes de guardarlo, no después.
     */
    it("no deja elegir la cotización propia si todavía no hay ninguna", async () => {
      const result = await updateDisplayPreferencesAction(
        idle,
        formData({ displayCurrency: "ARS", fxVariant: "MANUAL" }),
      );
      expect(result.status).toBe("error");
      expect(result.message).toContain("cotización propia");
    });

    it("deja elegirla una vez cargada", async () => {
      await setManualRateAction(idle, formData({ rate: "1.400,50" }));
      const result = await updateDisplayPreferencesAction(
        idle,
        formData({ displayCurrency: "ARS", fxVariant: "MANUAL" }),
      );
      expect(result.status).toBe("success");
      expect((await resolveRateBook(usuario.id)).active?.rateMicros).toBe(1_400_500_000n);
    });
  });

  describe("setManualRateAction", () => {
    it("guarda la cotización escrita en convenio argentino", async () => {
      const result = await setManualRateAction(idle, formData({ rate: "1.400,50", note: "Compré así" }));
      expect(result.status).toBe("success");

      const guardada = await getDb().manualRate.findFirstOrThrow({ where: { userId: usuario.id } });
      expect(guardada.rateMicros).toBe(1_400_500_000n);
      expect(guardada.note).toBe("Compré así");
    });

    /**
     * Dos ajustes el mismo día son la misma decisión corregida, no dos
     * cotizaciones distintas: la fila del día se pisa en vez de acumularse.
     */
    it("dos cargas el mismo día son una sola cotización corregida", async () => {
      await setManualRateAction(idle, formData({ rate: "1.400" }));
      await setManualRateAction(idle, formData({ rate: "1.500" }));

      const filas = await getDb().manualRate.findMany({ where: { userId: usuario.id } });
      expect(filas).toHaveLength(1);
      expect(filas[0]?.rateMicros).toBe(1_500n * RATE_SCALE);
    });

    it("rechaza lo que no es una cotización usable", async () => {
      for (const rate of ["", "gratis", "0", "-1400"]) {
        const result = await setManualRateAction(idle, formData({ rate }));
        expect(result.status, `rechaza "${rate}"`).toBe("error");
      }
    });

    it("la cotización de una persona no llega a otra", async () => {
      await setManualRateAction(idle, formData({ rate: "9.999" }));
      expect(await getDb().manualRate.findFirst({ where: { userId: otro.id } })).toBeNull();
    });

    it("sin sesión no guarda nada", async () => {
      const previo = currentUserId.value;
      currentUserId.value = "";
      try {
        const result = await setManualRateAction(idle, formData({ rate: "1.400" }));
        expect(result.status).toBe("error");
        expect(await getDb().manualRate.count({ where: { userId: usuario.id } })).toBe(0);
      } finally {
        currentUserId.value = previo;
      }
    });
  });
});
