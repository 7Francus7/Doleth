import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createTestUser, deleteTestUser, formData, hasDatabase, type TestUser } from "../../test/fixtures";
import { RATE_SCALE } from "./currency";
import { QUANTITY_SCALE } from "./holdings";

/**
 * Tenencias valuadas por cantidad y precio, contra una base real.
 *
 * Lo que se prueba es la promesa que distingue esta etapa: que el valor de una
 * tenencia se actualice **sin que nadie toque nada**. Y su contracara, que es lo
 * que la vuelve confiable: que cuando no hay precio, la pantalla lo diga en vez
 * de mostrar un cero o hacer pasar por actual un número de hace tres meses.
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

const { createInvestmentAction } = await import("../../app/actions/finance");
const { getPortfolio } = await import("./data");
const { getInvestmentsModel } = await import("../../features/investments/data/getInvestmentsModel");
const { setManualPrice, refreshPrices, loadLatestPrices } = await import("./rates/prices");
const { getDb } = await import("../db");

const idle = { ok: false, message: "" };
const PROVEEDOR = "prueba-precios";

describe.skipIf(!hasDatabase)("cartera valuada por cantidad y precio", () => {
  let usuario: TestUser;

  beforeAll(async () => {
    usuario = await createTestUser("cartera");
    currentUserId.value = usuario.id;
    // El fixture siembra una inversión sin cantidad: se archiva para que no
    // ensucie los totales de estas pruebas.
    await getDb().investment.updateMany({ where: { userId: usuario.id }, data: { status: "ARCHIVED" } });
  });

  afterAll(async () => {
    await getDb().assetPrice.deleteMany({ where: { symbol: { in: ["AAPL", "BTC", "DEPTO"] } } });
    await deleteTestUser(usuario.id);
  });

  afterEach(async () => {
    await getDb().assetPrice.deleteMany({ where: { symbol: { in: ["AAPL", "BTC", "DEPTO"] } } });
  });

  describe("alta", () => {
    it("guarda la cantidad junto con el símbolo", async () => {
      const result = await createInvestmentAction(
        idle,
        formData({
          name: "CEDEAR AAPL",
          kind: "STOCKS",
          symbol: "AAPL",
          currency: "ARS",
          quantity: "12",
          invested: "200000",
          currentValue: "0",
        }),
      );
      expect(result.ok).toBe(true);

      const guardada = await getDb().investment.findFirstOrThrow({
        where: { userId: usuario.id, name: "CEDEAR AAPL" },
      });
      expect(guardada.quantityMicros).toBe(12n * QUANTITY_SCALE);
      expect(guardada.symbol).toBe("AAPL");
    });

    /**
     * Una cantidad sin símbolo quedaría contando unidades de algo que Doleth no
     * sabe cotizar: el valor seguiría saliendo del número escrito a mano y la
     * promesa de "se actualiza solo" no se cumpliría.
     */
    it("no acepta una cantidad sin símbolo", async () => {
      const result = await createInvestmentAction(
        idle,
        formData({ name: "Algo", kind: "OTHER", currency: "ARS", quantity: "5", invested: "1000", currentValue: "0" }),
      );
      expect(result.ok).toBe(false);
      expect(result.error?.code).toBe("symbol-required");
    });

    it("rechaza una cantidad que no se entiende", async () => {
      const result = await createInvestmentAction(
        idle,
        formData({
          name: "Algo",
          kind: "OTHER",
          symbol: "XX",
          currency: "ARS",
          quantity: "muchas",
          invested: "1000",
          currentValue: "0",
        }),
      );
      expect(result.ok).toBe(false);
      expect(result.error?.field).toBe("quantity");
    });

    /** Un departamento no tiene unidades: sin cantidad se guarda igual. */
    it("una tenencia sin cantidad se sigue aceptando", async () => {
      const result = await createInvestmentAction(
        idle,
        formData({
          name: "Departamento",
          kind: "REAL_ESTATE",
          currency: "ARS",
          invested: "50000000",
          currentValue: "62000000",
        }),
      );
      expect(result.ok).toBe(true);
    });
  });

  describe("valuación", () => {
    /**
     * La promesa de la etapa: nadie tocó la inversión, sólo apareció un precio, y
     * el valor cambió.
     */
    it("el valor sale de cantidad por precio, sin tocar la inversión", async () => {
      const antes = await getPortfolio(usuario.id);
      const sinPrecio = antes.portfolio.holdings.find((holding) => holding.symbol === "AAPL")!;
      expect(sinPrecio.mode).toBe("declared");
      expect(sinPrecio.valueCents).toBe(0n);

      await setManualPrice({
        symbol: "AAPL",
        currency: "ARS",
        priceMicros: 25_000n * RATE_SCALE,
        asOf: new Date("2026-08-08T00:00:00.000Z"),
      });

      const despues = await getPortfolio(usuario.id);
      const conPrecio = despues.portfolio.holdings.find((holding) => holding.symbol === "AAPL")!;
      // 12 unidades a $25.000,00.
      expect(conPrecio.valueCents).toBe(30_000_000n);
      expect(conPrecio.mode).toBe("manual-price");
    });

    it("un precio del mercado se distingue de uno propio", async () => {
      await getDb().assetPrice.create({
        data: {
          symbol: "AAPL",
          currency: "ARS",
          priceMicros: 25_000n * RATE_SCALE,
          provider: PROVEEDOR,
          asOf: new Date("2026-08-08T00:00:00.000Z"),
        },
      });
      const { portfolio } = await getPortfolio(usuario.id);
      expect(portfolio.holdings.find((holding) => holding.symbol === "AAPL")?.mode).toBe("market");
    });

    it("toma la publicación más reciente del símbolo", async () => {
      await getDb().assetPrice.createMany({
        data: [
          { symbol: "AAPL", currency: "ARS", priceMicros: 10_000n * RATE_SCALE, provider: PROVEEDOR, asOf: new Date("2026-08-01T00:00:00.000Z") },
          { symbol: "AAPL", currency: "ARS", priceMicros: 30_000n * RATE_SCALE, provider: PROVEEDOR, asOf: new Date("2026-08-08T00:00:00.000Z") },
        ],
      });
      const { portfolio } = await getPortfolio(usuario.id);
      expect(portfolio.holdings.find((holding) => holding.symbol === "AAPL")?.valueCents).toBe(36_000_000n);
    });

    it("sin precio, la tenencia declara que su valor no es de hoy", async () => {
      const model = await getInvestmentsModel(usuario.id);
      const fila = model.holdings.find((holding) => holding.name === "CEDEAR AAPL")!;
      expect(fila.source).toContain("Sin precio de AAPL");
      expect(fila.source).toContain("último valor que cargaste");
    });

    it("una tenencia sin cantidad dice que su valor es el que se cargó", async () => {
      const model = await getInvestmentsModel(usuario.id);
      const fila = model.holdings.find((holding) => holding.name === "Departamento")!;
      expect(fila.source).toBe("Valor que cargaste vos.");
    });

    it("informa cuánto pesa cada tenencia en la cartera", async () => {
      const model = await getInvestmentsModel(usuario.id);
      expect(model.holdings.every((holding) => holding.weightLabel.includes("de la cartera"))).toBe(true);
    });

    /**
     * Tres estados, no dos. Una tenencia con precio propio se valúa por cantidad
     * por precio aunque no se actualice sola: contarla como "cargada a mano" le
     * negaría a la persona la mitad de lo que ya consiguió.
     */
    it("la frase distingue los tres orígenes de valor", async () => {
      await setManualPrice({
        symbol: "AAPL",
        currency: "ARS",
        priceMicros: 25_000n * RATE_SCALE,
        asOf: new Date("2026-08-08T00:00:00.000Z"),
      });
      const conPrecioPropio = await getInvestmentsModel(usuario.id);
      expect(conPrecioPropio.stability).toContain("usa el precio que cargaste");
      expect(conPrecioPropio.stability).toContain("que escribiste");

      await getDb().assetPrice.deleteMany({ where: { symbol: "AAPL" } });
      await getDb().assetPrice.create({
        data: {
          symbol: "AAPL",
          currency: "ARS",
          priceMicros: 25_000n * RATE_SCALE,
          provider: PROVEEDOR,
          asOf: new Date("2026-08-08T00:00:00.000Z"),
        },
      });
      const conMercado = await getInvestmentsModel(usuario.id);
      expect(conMercado.stability).toContain("se actualiza sola con el precio del mercado");
    });
  });

  describe("precios", () => {
    it("guarda lo que trae el proveedor y no lo vuelve a pedir en la ventana", async () => {
      const provider = {
        name: PROVEEDOR,
        read: async () => ({
          prices: [
            {
              symbol: "AAPL",
              currency: "ARS" as const,
              priceMicros: 25_000n * RATE_SCALE,
              asOf: new Date("2026-08-08T00:00:00.000Z"),
            },
          ],
          rejected: [],
        }),
      };

      expect((await refreshPrices(provider, ["AAPL"])).stored).toBe(1);
      expect((await refreshPrices(provider, ["AAPL"])).skipped).toBe(true);
    });

    /**
     * Un proveedor caído deja la cartera leyéndose con el último precio conocido:
     * la plata de la persona no cambió porque una API no contestó.
     */
    it("un proveedor que falla no rompe ni borra lo que había", async () => {
      await setManualPrice({
        symbol: "BTC",
        currency: "ARS",
        priceMicros: 1_000n * RATE_SCALE,
        asOf: new Date("2026-08-01T00:00:00.000Z"),
      });

      const roto = {
        name: "proveedor-roto",
        read: async () => {
          throw new Error("sin red");
        },
      };
      const outcome = await refreshPrices(roto, ["BTC"]);
      expect(outcome.stored).toBe(0);
      expect(outcome.rejected).toEqual(["BTC"]);

      expect((await loadLatestPrices(["BTC"])).get("BTC")?.priceMicros).toBe(1_000n * RATE_SCALE);
    });

    it("normaliza el símbolo al buscar y al guardar", async () => {
      await setManualPrice({
        symbol: " aapl ",
        currency: "ARS",
        priceMicros: 25_000n * RATE_SCALE,
        asOf: new Date("2026-08-08T00:00:00.000Z"),
      });
      expect((await loadLatestPrices(["aapl"])).has("AAPL")).toBe(true);
    });

    it("sin símbolos que pedir no molesta al proveedor", async () => {
      let called = false;
      const provider = {
        name: "no-deberia-llamarse",
        read: async () => {
          called = true;
          return { prices: [], rejected: [] };
        },
      };
      await refreshPrices(provider, []);
      expect(called).toBe(false);
    });
  });
});
