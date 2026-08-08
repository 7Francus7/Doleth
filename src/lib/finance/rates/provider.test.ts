import { describe, expect, it, vi } from "vitest";
import { RATE_SCALE } from "../currency";
import { decimalToMicros, dolarApiProvider, parseDolarApiPayload } from "./provider";

/** Una respuesta con la forma que publica dolarapi.com. */
const payload = [
  {
    moneda: "USD",
    casa: "oficial",
    nombre: "Oficial",
    compra: 1_020.5,
    venta: 1_060.5,
    fechaActualizacion: "2026-08-08T14:00:00.000Z",
  },
  {
    moneda: "USD",
    casa: "blue",
    nombre: "Blue",
    compra: 1_380,
    venta: 1_400,
    fechaActualizacion: "2026-08-08T14:05:00.000Z",
  },
  {
    moneda: "USD",
    casa: "mayorista",
    nombre: "Mayorista",
    compra: 1_010,
    venta: 1_015,
    fechaActualizacion: "2026-08-08T14:00:00.000Z",
  },
];

const jsonResponse = (body: unknown, status = 200) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

describe("decimalToMicros", () => {
  it("convierte sin arrastrar el error del punto flotante", () => {
    expect(decimalToMicros(1_400)).toBe(1_400n * RATE_SCALE);
    expect(decimalToMicros(1_060.5)).toBe(1_060_500_000n);
    // 0,1 + 0,2 no es 0,3 en binario; el redondeo lo resuelve antes del BigInt.
    expect(decimalToMicros(0.1 + 0.2)).toBe(300_000n);
  });

  it("rechaza lo que no es una cotización", () => {
    expect(decimalToMicros(0)).toBeNull();
    expect(decimalToMicros(-1)).toBeNull();
    expect(decimalToMicros(Number.NaN)).toBeNull();
    expect(decimalToMicros(Number.POSITIVE_INFINITY)).toBeNull();
  });

  it("rechaza magnitudes que acercarían el double a su límite de precisión", () => {
    expect(decimalToMicros(10_000_001)).toBeNull();
  });
});

describe("parseDolarApiPayload", () => {
  it("lee las casas contempladas y toma el precio de venta", () => {
    const { rates } = parseDolarApiPayload(payload);
    expect(rates).toHaveLength(2);
    expect(rates[0]).toEqual({
      base: "USD",
      quote: "ARS",
      variant: "OFICIAL",
      rateMicros: 1_060_500_000n,
      asOf: new Date("2026-08-08T14:00:00.000Z"),
    });
    expect(rates[1]?.variant).toBe("BLUE");
    expect(rates[1]?.rateMicros).toBe(1_400n * RATE_SCALE);
  });

  /**
   * El mayorista es una cotización entre bancos: mostrarla como forma de leer el
   * patrimonio propio sería ofrecer plata a la que la persona no accede.
   */
  it("descarta el mayorista y dice por qué", () => {
    const { rates, rejected } = parseDolarApiPayload(payload);
    expect(rates.map((rate) => rate.variant)).not.toContain("MAYORISTA");
    expect(rejected.some((entry) => entry.reason.includes("mayorista"))).toBe(true);
  });

  it("descarta una cotización sin precio en vez de asumir cero", () => {
    const { rates, rejected } = parseDolarApiPayload([
      { moneda: "USD", casa: "blue", fechaActualizacion: "2026-08-08T14:00:00.000Z" },
    ]);
    expect(rates).toHaveLength(0);
    expect(rejected[0]?.reason).toContain("venta");
  });

  it("descarta una cotización con fecha ilegible", () => {
    const { rates, rejected } = parseDolarApiPayload([
      { moneda: "USD", casa: "blue", venta: 1_400, fechaActualizacion: "el martes" },
    ]);
    expect(rates).toHaveLength(0);
    expect(rejected[0]?.reason).toContain("Fecha");
  });

  it("no asume que el proveedor siga cotizando dólares", () => {
    const { rates, rejected } = parseDolarApiPayload([
      { moneda: "EUR", casa: "blue", venta: 1_500, fechaActualizacion: "2026-08-08T14:00:00.000Z" },
    ]);
    expect(rates).toHaveLength(0);
    expect(rejected[0]?.reason).toContain("EUR");
  });

  it("sobrevive a una respuesta que no es una lista", () => {
    expect(parseDolarApiPayload({ error: "mantenimiento" }).rates).toEqual([]);
    expect(parseDolarApiPayload(null).rejected).toHaveLength(1);
  });

  it("una cotización rota no arrastra a las sanas", () => {
    const { rates } = parseDolarApiPayload([{ casa: "roto" }, ...payload]);
    expect(rates).toHaveLength(2);
  });
});

describe("dolarApiProvider", () => {
  it("lee una respuesta correcta", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(payload));
    const reading = await dolarApiProvider(fetchImpl as unknown as typeof fetch).read();
    expect(reading.rates).toHaveLength(2);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  /**
   * Que una API pública no conteste no puede romper la pantalla de nadie: el
   * patrimonio sigue siendo verdadero en su moneda original y la valuación ya
   * sabe declarar lo que no pudo convertir.
   */
  it("un proveedor caído es una lectura vacía, no una excepción", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    });
    const reading = await dolarApiProvider(fetchImpl as unknown as typeof fetch).read();
    expect(reading.rates).toEqual([]);
    expect(reading.rejected[0]?.reason).toContain("contactar");
  });

  it("un error HTTP se informa con su código", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(null, 503));
    const reading = await dolarApiProvider(fetchImpl as unknown as typeof fetch).read();
    expect(reading.rates).toEqual([]);
    expect(reading.rejected[0]?.reason).toContain("503");
  });

  it("un JSON corrupto no escapa como excepción", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    }) as unknown as Response);
    const reading = await dolarApiProvider(fetchImpl as unknown as typeof fetch).read();
    expect(reading.rates).toEqual([]);
  });

  it("corta la espera y no cuelga la petición del usuario", async () => {
    const fetchImpl = vi.fn(
      (_url: string, init?: { signal?: AbortSignal }) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const error = new Error("aborted");
            error.name = "AbortError";
            reject(error);
          });
        }),
    );
    const reading = await dolarApiProvider(fetchImpl as unknown as typeof fetch, { timeoutMs: 10 }).read();
    expect(reading.rates).toEqual([]);
    expect(reading.rejected[0]?.reason).toContain("a tiempo");
  });
});
