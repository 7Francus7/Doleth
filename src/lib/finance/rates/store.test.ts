import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { getDb } from "../../db";
import { createTestUser, deleteTestUser, hasDatabase, type TestUser } from "../../../test/fixtures";
import { RATE_SCALE } from "../currency";
import { valuate } from "../valuation";
import { money } from "../currency";
import { REFRESH_TTL_MS, refreshMarketRates, resolveRateBook } from "./store";
import type { ProviderReading, RateProvider } from "./provider";

/**
 * Resolución y persistencia de cotizaciones contra una base real.
 *
 * Necesita PostgreSQL: la regla que se prueba acá —qué cotización termina
 * usando una persona— sale de la interacción entre su preferencia y las filas
 * guardadas, y simular esa interacción probaría el simulacro.
 */

const provider = (reading: ProviderReading, name = "proveedor-de-prueba"): RateProvider => ({
  name,
  read: async () => reading,
});

const rate = (variant: "OFICIAL" | "BLUE", rateMicros: bigint, asOf: string) => ({
  base: "USD" as const,
  quote: "ARS" as const,
  variant,
  rateMicros,
  asOf: new Date(asOf),
});

describe.skipIf(!hasDatabase)("cotizaciones · resolución y persistencia", () => {
  let usuario: TestUser;
  let otro: TestUser;
  const providerNames: string[] = [];

  const uniqueProvider = (reading: ProviderReading) => {
    const name = `proveedor-${providerNames.length}-${Date.now()}`;
    providerNames.push(name);
    return provider(reading, name);
  };

  beforeAll(async () => {
    usuario = await createTestUser("cotizaciones");
    otro = await createTestUser("cotizaciones-otro");
  });

  afterAll(async () => {
    await deleteTestUser(usuario.id);
    await deleteTestUser(otro.id);
    await getDb().marketRate.deleteMany({ where: { provider: { in: providerNames } } });
  });

  afterEach(async () => {
    await getDb().manualRate.deleteMany({ where: { userId: { in: [usuario.id, otro.id] } } });
  });

  describe("refreshMarketRates", () => {
    it("guarda las cotizaciones que trae el proveedor", async () => {
      const p = uniqueProvider({
        rates: [
          rate("OFICIAL", 1_060n * RATE_SCALE, "2026-08-08T14:00:00.000Z"),
          rate("BLUE", 1_400n * RATE_SCALE, "2026-08-08T14:00:00.000Z"),
        ],
        rejected: [],
      });
      const outcome = await refreshMarketRates(p);
      expect(outcome.stored).toBe(2);
      expect(outcome.skipped).toBe(false);
    });

    /**
     * Volver a leer la misma publicación no puede crear una fila nueva: la
     * historia de cotizaciones dejaría de servir para saber a qué precio se leyó
     * algo si estuviera llena de duplicados del mismo instante.
     */
    it("releer la misma publicación no duplica nada", async () => {
      const reading = { rates: [rate("BLUE", 1_400n * RATE_SCALE, "2026-08-08T15:00:00.000Z")], rejected: [] };
      const p = uniqueProvider(reading);
      await refreshMarketRates(p);
      // Con `now` corrido más allá de la ventana, vuelve a consultar de verdad.
      const outcome = await refreshMarketRates(p, new Date(Date.now() + REFRESH_TTL_MS * 2));
      expect(outcome.stored).toBe(0);
      expect(outcome.unchanged).toBe(1);
    });

    it("no molesta al proveedor dentro de la ventana", async () => {
      const p = uniqueProvider({ rates: [rate("BLUE", 1_400n * RATE_SCALE, "2026-08-08T16:00:00.000Z")], rejected: [] });
      await refreshMarketRates(p);
      const outcome = await refreshMarketRates(p);
      expect(outcome.skipped).toBe(true);
    });

    it("un proveedor caído no rompe: no guarda nada y sigue", async () => {
      const p = uniqueProvider({ rates: [], rejected: [{ reason: "sin red", raw: null }] });
      const outcome = await refreshMarketRates(p);
      expect(outcome.stored).toBe(0);
      expect(outcome.rejected).toBe(1);
    });
  });

  describe("resolveRateBook", () => {
    it("usa el tipo de cambio que la persona eligió", async () => {
      const p = uniqueProvider({
        rates: [
          rate("OFICIAL", 1_060n * RATE_SCALE, "2026-08-08T17:00:00.000Z"),
          rate("BLUE", 1_400n * RATE_SCALE, "2026-08-08T17:00:00.000Z"),
        ],
        rejected: [],
      });
      await refreshMarketRates(p);

      await getDb().user.update({ where: { id: usuario.id }, data: { fxVariant: "OFICIAL" } });
      expect((await resolveRateBook(usuario.id)).active?.rateMicros).toBe(1_060n * RATE_SCALE);

      await getDb().user.update({ where: { id: usuario.id }, data: { fxVariant: "BLUE" } });
      expect((await resolveRateBook(usuario.id)).active?.rateMicros).toBe(1_400n * RATE_SCALE);
    });

    it("toma la publicación más reciente de ese tipo de cambio", async () => {
      await refreshMarketRates(
        uniqueProvider({ rates: [rate("BLUE", 1_500n * RATE_SCALE, "2026-08-09T10:00:00.000Z")], rejected: [] }),
      );
      await getDb().user.update({ where: { id: usuario.id }, data: { fxVariant: "BLUE" } });
      expect((await resolveRateBook(usuario.id)).active?.asOf).toEqual(new Date("2026-08-09T10:00:00.000Z"));
    });

    /**
     * La regla central: quien eligió MANUAL lee con su cotización y no con la
     * del mercado, aunque el mercado tenga una más nueva. Y quien eligió un tipo
     * de mercado no ve cambiar su patrimonio por haber cargado alguna vez una
     * cotización propia.
     */
    it("MANUAL usa la cotización propia y no cae al mercado", async () => {
      await getDb().manualRate.create({
        data: {
          userId: usuario.id,
          baseCurrency: "USD",
          quoteCurrency: "ARS",
          rateMicros: 1_234n * RATE_SCALE,
          asOf: new Date("2026-08-08T00:00:00.000Z"),
        },
      });
      await getDb().user.update({ where: { id: usuario.id }, data: { fxVariant: "MANUAL" } });

      const book = await resolveRateBook(usuario.id);
      expect(book.variant).toBe("MANUAL");
      expect(book.active?.rateMicros).toBe(1_234n * RATE_SCALE);
      expect(book.active?.provider).toBeNull();
    });

    it("elegir un tipo de mercado ignora la cotización propia cargada", async () => {
      await getDb().manualRate.create({
        data: {
          userId: usuario.id,
          baseCurrency: "USD",
          quoteCurrency: "ARS",
          rateMicros: 1_234n * RATE_SCALE,
          asOf: new Date("2026-08-08T00:00:00.000Z"),
        },
      });
      await getDb().user.update({ where: { id: usuario.id }, data: { fxVariant: "BLUE" } });
      expect((await resolveRateBook(usuario.id)).active?.rateMicros).not.toBe(1_234n * RATE_SCALE);
    });

    it("la cotización propia de una persona no la ve otra", async () => {
      await getDb().manualRate.create({
        data: {
          userId: usuario.id,
          baseCurrency: "USD",
          quoteCurrency: "ARS",
          rateMicros: 9_999n * RATE_SCALE,
          asOf: new Date("2026-08-08T00:00:00.000Z"),
        },
      });
      await getDb().user.updateMany({ where: { id: { in: [usuario.id, otro.id] } }, data: { fxVariant: "MANUAL" } });

      expect((await resolveRateBook(usuario.id)).active?.rateMicros).toBe(9_999n * RATE_SCALE);
      expect((await resolveRateBook(otro.id)).active).toBeNull();
    });

    it("sin cotización devuelve un libro vacío en vez de fallar", async () => {
      await getDb().user.update({ where: { id: otro.id }, data: { fxVariant: "MANUAL" } });
      const book = await resolveRateBook(otro.id);
      expect(book.active).toBeNull();
      expect(book.rates).toEqual([]);
      expect(book.stale).toBe(false);
    });

    /**
     * El libro vacío tiene que producir un total honesto: los pesos se suman y
     * los dólares se declaran sin convertir, no se cuentan como cero.
     */
    it("un libro vacío hace que la valuación declare el hueco", async () => {
      await getDb().user.update({ where: { id: otro.id }, data: { fxVariant: "MANUAL" } });
      const book = await resolveRateBook(otro.id);
      const result = valuate([money(100_000n, "ARS"), money(5_000n, "USD")], "ARS", book);
      expect(result.totalCents).toBe(100_000n);
      expect(result.complete).toBe(false);
      expect(result.missing).toEqual([{ currency: "USD", cents: 5_000n }]);
    });

    it("declara vieja una cotización que ya no puede presentarse como vigente", async () => {
      await getDb().manualRate.create({
        data: {
          userId: usuario.id,
          baseCurrency: "USD",
          quoteCurrency: "ARS",
          rateMicros: 1_000n * RATE_SCALE,
          asOf: new Date("2026-08-01T00:00:00.000Z"),
        },
      });
      await getDb().user.update({ where: { id: usuario.id }, data: { fxVariant: "MANUAL" } });
      expect((await resolveRateBook(usuario.id, new Date("2026-08-08T00:00:00.000Z"))).stale).toBe(true);
      expect((await resolveRateBook(usuario.id, new Date("2026-08-02T00:00:00.000Z"))).stale).toBe(false);
    });
  });
});
