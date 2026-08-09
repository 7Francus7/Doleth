import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createTestUser, deleteTestUser, hasDatabase, type TestUser } from "../../test/fixtures";
import { QUANTITY_SCALE } from "../../lib/finance/holdings";

/**
 * Integraciones, contra una base real.
 *
 * Lo que se prueba son las tres garantías que hacen que un botón así se pueda
 * apretar sin miedo: que una fuente caída no rompa nada, que el resultado cuente
 * también lo que **no** se pudo, y que los dos motivos de fallo —"no lo cubro" y
 * "no pude consultarlo"— no se mezclen. Mezclarlos haría que un corte de red se
 * lea como una limitación permanente del producto.
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

/** El `fetch` global se reemplaza por uno controlado: nunca se toca la red. */
const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const { connectCryptoPricesAction, connectDollarAction } = await import("./actions");
const { getDb } = await import("../../lib/db");

const jsonResponse = (body: unknown, status = 200) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

const dolarPayload = [
  { moneda: "USD", casa: "blue", venta: 1_450, fechaActualizacion: new Date().toISOString() },
];
const cryptoPayload = { binance: { ask: 91_400_000 }, buenbit: { ask: 91_500_000 } };

describe.skipIf(!hasDatabase)("integraciones", () => {
  let usuario: TestUser;

  beforeAll(async () => {
    usuario = await createTestUser("integraciones");
    currentUserId.value = usuario.id;
    await getDb().investment.updateMany({ where: { userId: usuario.id }, data: { status: "ARCHIVED" } });
  });

  afterAll(async () => {
    await getDb().assetPrice.deleteMany({ where: { symbol: { in: ["BTC", "AAPL"] } } });
    await getDb().marketRate.deleteMany({ where: { provider: "dolarapi.com" } });
    await deleteTestUser(usuario.id);
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    fetchMock.mockReset();
  });

  describe("cotización del dólar", () => {
    it("trae la cotización y lo dice", async () => {
      fetchMock.mockResolvedValue(jsonResponse(dolarPayload));
      const result = await connectDollarAction();
      expect(result.status).toBe("success");
      expect(result.message).toContain("Listo");
    });

    /**
     * Una API pública caída no puede romper la pantalla ni dejar a la persona sin
     * saber qué hacer: se le dice qué pasó y cuál es la salida.
     */
    it("una fuente caída no rompe y ofrece la alternativa", async () => {
      await getDb().marketRate.deleteMany({ where: { provider: "dolarapi.com" } });
      fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));

      const result = await connectDollarAction();
      expect(result.status).toBe("error");
      expect(result.message).toContain("última cotización");
      expect(result.message).toContain("Moneda");
    });

    it("sin sesión no consulta nada", async () => {
      const previo = currentUserId.value;
      currentUserId.value = "";
      try {
        const result = await connectDollarAction();
        expect(result.status).toBe("error");
        expect(fetchMock).not.toHaveBeenCalled();
      } finally {
        currentUserId.value = previo;
      }
    });
  });

  describe("precios de inversiones", () => {
    it("sin tenencias con símbolo, lo explica en vez de consultar al pedo", async () => {
      const result = await connectCryptoPricesAction();
      expect(result.status).toBe("error");
      expect(result.message).toContain("cantidad y símbolo");
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("actualiza el precio de una tenencia de cripto", async () => {
      await getDb().investment.create({
        data: {
          userId: usuario.id,
          name: "Bitcoin",
          kind: "CRYPTO",
          symbol: "BTC",
          currency: "ARS",
          quantityMicros: 25_000n,
          investedCents: 100_000_00n,
          currentValueCents: 0n,
        },
      });
      fetchMock.mockResolvedValue(jsonResponse(cryptoPayload));

      const result = await connectCryptoPricesAction();
      expect(result.status).toBe("success");
      expect(result.message).toContain("Listo");
      expect(await getDb().assetPrice.count({ where: { symbol: "BTC" } })).toBe(1);
    });

    /**
     * El corazón de la prueba: BTC falló por red y AAPL porque no está cubierto.
     * Decir lo mismo de los dos haría creer que el producto no sabe cotizar
     * bitcoin, que es falso, o que la acción va a andar reintentando, que también.
     */
    it("distingue lo que no cubre de lo que no pudo consultar", async () => {
      await getDb().assetPrice.deleteMany({ where: { symbol: { in: ["BTC", "AAPL"] } } });
      await getDb().investment.create({
        data: {
          userId: usuario.id,
          name: "CEDEAR AAPL",
          kind: "STOCKS",
          symbol: "AAPL",
          currency: "ARS",
          quantityMicros: 12n * QUANTITY_SCALE,
          investedCents: 200_000_00n,
          currentValueCents: 0n,
        },
      });
      fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));

      const result = await connectCryptoPricesAction();
      expect(result.status).toBe("error");
      // AAPL: permanente, cargalo a mano.
      expect(result.message).toContain("Todavía no sabemos cotizar AAPL");
      expect(result.message).toContain("a mano");
      // BTC: pasajero, reintentá.
      expect(result.message).toContain("No pudimos consultar BTC");
      expect(result.message).toContain("de nuevo");
    });

    it("no le pide a la fuente un símbolo que no cubre", async () => {
      await getDb().investment.updateMany({
        where: { userId: usuario.id, symbol: "BTC" },
        data: { status: "ARCHIVED" },
      });
      fetchMock.mockResolvedValue(jsonResponse(cryptoPayload));

      await connectCryptoPricesAction();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
