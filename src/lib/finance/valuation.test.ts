import { describe, expect, it } from "vitest";
import { RATE_SCALE, money, type ExchangeRate } from "./currency";
import {
  STALE_RATE_DAYS,
  distributeProportionally,
  emptyRateBook,
  findRate,
  isRateStale,
  rateAgeDays,
  valuate,
  valuateOne,
  type RateBook,
} from "./valuation";

const usdArs = (rateMicros: bigint, asOf = "2026-08-08T12:00:00.000Z"): ExchangeRate => ({
  base: "USD",
  quote: "ARS",
  rateMicros,
  variant: "BLUE",
  asOf: new Date(asOf),
  provider: "prueba",
});

const book = (...rates: ExchangeRate[]): RateBook => ({ rates });

const AT_1400 = usdArs(1_400n * RATE_SCALE);

describe("valuate", () => {
  it("suma lo que ya está en la moneda pedida sin tocarlo", () => {
    const result = valuate([money(1_000n, "ARS"), money(2_500n, "ARS")], "ARS", emptyRateBook);
    expect(result.totalCents).toBe(3_500n);
    expect(result.complete).toBe(true);
    expect(result.oldestRateAsOf).toBeNull();
  });

  it("convierte y suma monedas mezcladas", () => {
    // $ 140.000,00 + US$ 100,00 a 1.400 = $ 280.000,00
    const result = valuate([money(14_000_000n, "ARS"), money(10_000n, "USD")], "ARS", book(AT_1400));
    expect(result.totalCents).toBe(28_000_000n);
    expect(result.complete).toBe(true);
  });

  it("valúa en dólares el mismo patrimonio", () => {
    const result = valuate([money(14_000_000n, "ARS"), money(10_000n, "USD")], "USD", book(AT_1400));
    expect(result.totalCents).toBe(20_000n);
  });

  /**
   * El corazón del módulo: sin cotización, los dólares no valen cero pesos.
   * El total dice lo que sabe y el hueco viaja aparte para que la pantalla lo
   * cuente.
   */
  it("no cuenta como cero lo que no puede convertir", () => {
    const result = valuate([money(14_000_000n, "ARS"), money(10_000n, "USD")], "ARS", emptyRateBook);
    expect(result.totalCents).toBe(14_000_000n);
    expect(result.complete).toBe(false);
    expect(result.missing).toEqual([{ currency: "USD", cents: 10_000n }]);
  });

  it("agrupa por moneda todo lo que quedó afuera", () => {
    const result = valuate([money(100n, "USD"), money(250n, "USD"), money(9n, "ARS")], "ARS", emptyRateBook);
    expect(result.missing).toEqual([{ currency: "USD", cents: 350n }]);
    expect(result.totalCents).toBe(9n);
  });

  it("no declara hueco cuando los importes de esa moneda se cancelan", () => {
    const result = valuate([money(500n, "USD"), money(-500n, "USD")], "ARS", emptyRateBook);
    expect(result.missing).toEqual([]);
    expect(result.complete).toBe(true);
  });

  it("informa la cotización más vieja de las que usó", () => {
    const vieja = usdArs(1_400n * RATE_SCALE, "2026-08-01T00:00:00.000Z");
    const result = valuate([money(10_000n, "USD")], "ARS", book(vieja));
    expect(result.oldestRateAsOf).toEqual(new Date("2026-08-01T00:00:00.000Z"));
  });

  it("una lista vacía vale cero y está completa", () => {
    const result = valuate([], "ARS", emptyRateBook);
    expect(result.totalCents).toBe(0n);
    expect(result.complete).toBe(true);
  });

  it("conserva el signo de los saldos negativos", () => {
    const result = valuate([money(-10_000n, "USD")], "ARS", book(AT_1400));
    expect(result.totalCents).toBe(-14_000_000n);
  });
});

describe("valuateOne", () => {
  it("devuelve null en vez de cero cuando falta la cotización", () => {
    expect(valuateOne(money(10_000n, "USD"), "ARS", emptyRateBook)).toBeNull();
  });

  it("deja pasar el importe que ya está en la moneda pedida", () => {
    expect(valuateOne(money(10_000n, "ARS"), "ARS", emptyRateBook)).toEqual({ cents: 10_000n, currency: "ARS" });
  });
});

describe("findRate", () => {
  it("encuentra el par en los dos sentidos", () => {
    expect(findRate(book(AT_1400), "USD", "ARS")).toBe(AT_1400);
    expect(findRate(book(AT_1400), "ARS", "USD")).toBe(AT_1400);
  });

  it("no busca cotización para una moneda contra sí misma", () => {
    expect(findRate(book(AT_1400), "ARS", "ARS")).toBeNull();
  });

  it("prefiere la primera del libro: el orden lo decide quien lo arma", () => {
    const propia = usdArs(1_500n * RATE_SCALE);
    expect(findRate(book(propia, AT_1400), "USD", "ARS")).toBe(propia);
  });
});

describe("antigüedad de la cotización", () => {
  const now = new Date("2026-08-08T12:00:00.000Z");

  it("mide en días completos", () => {
    expect(rateAgeDays(new Date("2026-08-08T00:00:00.000Z"), now)).toBe(0);
    expect(rateAgeDays(new Date("2026-08-07T00:00:00.000Z"), now)).toBe(1);
    expect(rateAgeDays(new Date("2026-08-05T00:00:00.000Z"), now)).toBe(3);
  });

  it("una cotización del futuro no tiene edad negativa", () => {
    expect(rateAgeDays(new Date("2026-08-09T00:00:00.000Z"), now)).toBe(0);
  });

  it("tolera el fin de semana antes de declararla vieja", () => {
    expect(isRateStale(new Date("2026-08-06T12:00:00.000Z"), now)).toBe(false);
    expect(isRateStale(new Date("2026-08-05T11:00:00.000Z"), now)).toBe(true);
    expect(STALE_RATE_DAYS).toBe(2);
  });
});

describe("distributeProportionally", () => {
  it("reparte sin perder ni inventar centavos", () => {
    const shares = distributeProportionally(100n, [1n, 1n, 1n]);
    expect(shares.reduce((sum, share) => sum + share, 0n)).toBe(100n);
    expect(shares).toEqual([34n, 33n, 33n]);
  });

  it("respeta la proporción", () => {
    expect(distributeProportionally(1_000n, [750n, 250n])).toEqual([750n, 250n]);
  });

  it("no divide por cero cuando no hay pesos", () => {
    expect(distributeProportionally(1_000n, [0n, 0n])).toEqual([0n, 0n]);
  });

  it("cierra también con totales negativos", () => {
    const shares = distributeProportionally(-100n, [1n, 1n, 1n]);
    expect(shares.reduce((sum, share) => sum + share, 0n)).toBe(-100n);
  });

  it("el resto va a las partes más grandes", () => {
    expect(distributeProportionally(10n, [7n, 2n, 1n])).toEqual([7n, 2n, 1n]);
    expect(distributeProportionally(100n, [5n, 3n, 1n])).toEqual([56n, 33n, 11n]);
  });
});
