import { describe, expect, it, vi } from "vitest";
import { RATE_SCALE } from "../currency";
import { SUPPORTED_CRYPTO, cryptoYaProvider, parseCryptoYaPayload } from "./cryptoProvider";

/** Forma real de la respuesta de CriptoYa: una entrada por exchange. */
const payload = {
  binance: { ask: 91_400_000, bid: 91_100_000, time: 1_786_000_000 },
  buenbit: { ask: 91_500_000, bid: 91_200_000, time: 1_786_000_000 },
  ripio: { ask: 92_000_000, bid: 91_700_000, time: 1_786_000_000 },
};

const jsonResponse = (body: unknown, status = 200) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

describe("parseCryptoYaPayload", () => {
  /**
   * La mediana y no el promedio: un exchange que publicó un valor absurdo
   * correría el promedio, y tomar un exchange fijo ataría el precio de la cartera
   * de alguien a que ese exchange siga existiendo.
   */
  it("toma la mediana de los precios de venta", () => {
    const price = parseCryptoYaPayload("BTC", payload);
    expect(price?.priceMicros).toBe(91_500_000n * RATE_SCALE);
    expect(price?.currency).toBe("ARS");
    expect(price?.symbol).toBe("BTC");
  });

  it("un exchange con un valor absurdo no arrastra el precio", () => {
    const price = parseCryptoYaPayload("BTC", { ...payload, roto: { ask: 1 } });
    // Con cuatro valores, la mediana promedia los dos del medio: 91,4M y 91,5M.
    expect(price?.priceMicros).toBe(91_450_000n * RATE_SCALE);
  });

  it("acepta `totalAsk` cuando el exchange no publica `ask`", () => {
    const price = parseCryptoYaPayload("ETH", { lemon: { totalAsk: 5_000_000 } });
    expect(price?.priceMicros).toBe(5_000_000n * RATE_SCALE);
  });

  it("descarta entradas sin precio usable en vez de contarlas como cero", () => {
    const price = parseCryptoYaPayload("BTC", { a: { ask: 91_400_000 }, b: { ask: null }, c: "roto" });
    expect(price?.priceMicros).toBe(91_400_000n * RATE_SCALE);
  });

  it("sin ningún precio devuelve null", () => {
    expect(parseCryptoYaPayload("BTC", {})).toBeNull();
    expect(parseCryptoYaPayload("BTC", null)).toBeNull();
    expect(parseCryptoYaPayload("BTC", [1, 2, 3])).toBeNull();
  });
});

describe("cryptoYaProvider", () => {
  it("pide cada símbolo y devuelve sus precios", async () => {
    const urls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      urls.push(String(url));
      return jsonResponse(payload);
    });
    const reading = await cryptoYaProvider(fetchImpl as unknown as typeof fetch).read(["BTC", "ETH"]);

    expect(reading.prices).toHaveLength(2);
    expect(reading.rejected).toEqual([]);
    expect(urls).toHaveLength(2);
    expect(urls[0]).toContain("/btc/ars/");
  });

  /**
   * Pedirle al proveedor un símbolo que no existe devuelve un error que no se
   * distingue de una caída, y eso convertiría un símbolo mal escrito en "el
   * proveedor está caído". Por eso el motivo viaja con cada rechazo: `unsupported`
   * es permanente y pide cargar el precio a mano; `unavailable` es pasajero y
   * pide reintentar.
   */
  it("no le pide al proveedor símbolos que no cubre", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(payload));
    const reading = await cryptoYaProvider(fetchImpl as unknown as typeof fetch).read(["AAPL", "BTC"]);

    expect(reading.rejected).toEqual([{ symbol: "AAPL", reason: "unsupported" }]);
    expect(reading.prices).toHaveLength(1);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  /** Que una moneda falle no puede dejar sin actualizar al resto de la cartera. */
  it("un símbolo que falla no arrastra a los demás", async () => {
    const fetchImpl = vi.fn(async (url: string) =>
      String(url).includes("/eth/") ? jsonResponse(null, 503) : jsonResponse(payload),
    );
    const reading = await cryptoYaProvider(fetchImpl as unknown as typeof fetch).read(["BTC", "ETH"]);

    expect(reading.prices.map((price) => price.symbol)).toEqual(["BTC"]);
    expect(reading.rejected).toEqual([{ symbol: "ETH", reason: "unavailable" }]);
  });

  it("un proveedor caído deja todo en rechazados, sin lanzar", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    });
    const reading = await cryptoYaProvider(fetchImpl as unknown as typeof fetch).read(["BTC"]);

    expect(reading.prices).toEqual([]);
    expect(reading.rejected).toEqual([{ symbol: "BTC", reason: "unavailable" }]);
  });

  it("corta la espera en vez de colgar la petición del usuario", async () => {
    const fetchImpl = vi.fn(
      (_url: string, init?: { signal?: AbortSignal }) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    );
    const reading = await cryptoYaProvider(fetchImpl as unknown as typeof fetch, { timeoutMs: 10 }).read(["BTC"]);
    expect(reading.rejected).toEqual([{ symbol: "BTC", reason: "unavailable" }]);
  });

  it("normaliza el símbolo escrito de cualquier forma", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(payload));
    const reading = await cryptoYaProvider(fetchImpl as unknown as typeof fetch).read([" btc "]);
    expect(reading.prices[0]?.symbol).toBe("BTC");
  });

  it("el catálogo cubre las monedas que la gente tiene en Argentina", () => {
    expect(SUPPORTED_CRYPTO).toContain("BTC");
    expect(SUPPORTED_CRYPTO).toContain("USDT");
  });
});
