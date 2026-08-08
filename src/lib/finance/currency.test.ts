import { describe, expect, it } from "vitest";
import {
  RATE_SCALE,
  convert,
  divideRounded,
  formatRate,
  isFxVariant,
  isSupportedCurrency,
  money,
  parseRateInput,
  rateApplies,
  type ExchangeRate,
} from "./currency";

const rate = (rateMicros: bigint): ExchangeRate => ({
  base: "USD",
  quote: "ARS",
  rateMicros,
  variant: "BLUE",
  asOf: new Date("2026-08-08T12:00:00.000Z"),
  provider: "prueba",
});

/** 1.400 pesos por dólar. */
const AT_1400 = rate(1_400n * RATE_SCALE);

describe("divideRounded", () => {
  it("redondea al más cercano", () => {
    expect(divideRounded(10n, 3n)).toBe(3n);
    expect(divideRounded(20n, 3n)).toBe(7n);
  });

  it("manda el medio hacia afuera del cero, en los dos signos", () => {
    expect(divideRounded(5n, 2n)).toBe(3n);
    expect(divideRounded(-5n, 2n)).toBe(-3n);
    expect(divideRounded(5n, -2n)).toBe(-3n);
    expect(divideRounded(-5n, -2n)).toBe(3n);
  });

  it("no pierde precisión con importes grandes", () => {
    // Un número que no entra en un double sin redondear.
    const huge = 9_007_199_254_740_993n;
    expect(divideRounded(huge * 3n, 3n)).toBe(huge);
  });

  it("rechaza dividir por cero en vez de devolver un importe inventado", () => {
    expect(() => divideRounded(1n, 0n)).toThrow();
  });
});

describe("convert", () => {
  it("va de la moneda fuerte a la débil multiplicando", () => {
    // US$ 100,00 a 1.400 son $ 140.000,00.
    expect(convert(money(10_000n, "USD"), "ARS", AT_1400)).toEqual({ cents: 14_000_000n, currency: "ARS" });
  });

  it("va de la débil a la fuerte dividiendo por la misma cotización", () => {
    expect(convert(money(14_000_000n, "ARS"), "USD", AT_1400)).toEqual({ cents: 10_000n, currency: "USD" });
  });

  it("no toca un importe que ya está en la moneda pedida", () => {
    const original = money(12_345n, "ARS");
    expect(convert(original, "ARS", AT_1400)).toBe(original);
  });

  it("devuelve null cuando la cotización no cubre el par", () => {
    const eurRate: ExchangeRate = { ...AT_1400, base: "USD", quote: "USD" };
    expect(convert(money(100n, "ARS"), "USD", eurRate)).toBeNull();
  });

  it("devuelve null ante una cotización sin sentido en vez de un importe absurdo", () => {
    expect(convert(money(100n, "USD"), "ARS", rate(0n))).toBeNull();
    expect(convert(money(100n, "USD"), "ARS", rate(-5n))).toBeNull();
  });

  it("mantiene el signo al convertir un importe negativo", () => {
    expect(convert(money(-10_000n, "USD"), "ARS", AT_1400)?.cents).toBe(-14_000_000n);
  });

  /**
   * La razón de dividir en vez de invertir la cotización: si primero se
   * calculara 1/1400 en millonésimas (714n) y después se multiplicara, el ida y
   * vuelta se desviaría de forma visible. Dividiendo, vuelve al mismo lugar.
   */
  it("el ida y vuelta cierra sobre importes reales", () => {
    const oddRate = rate(1_437_650_000n); // 1.437,65
    for (const cents of [1n, 99n, 100n, 12_345n, 999_999n, 100_000_000n]) {
      const toArs = convert(money(cents, "USD"), "ARS", oddRate)!;
      const back = convert(toArs, "USD", oddRate)!;
      expect(back.cents).toBe(cents);
    }
  });

  it("una cotización con decimales finos no se recorta", () => {
    // 1.234,567891 pesos por dólar sobre US$ 1,00.
    const fine = rate(1_234_567_891n);
    expect(convert(money(100n, "USD"), "ARS", fine)?.cents).toBe(123_457n);
  });
});

describe("rateApplies", () => {
  it("sirve en los dos sentidos del par", () => {
    expect(rateApplies(AT_1400, "USD", "ARS")).toBe(true);
    expect(rateApplies(AT_1400, "ARS", "USD")).toBe(true);
  });

  it("no encadena cruces que nadie publicó", () => {
    const arsOnly: ExchangeRate = { ...AT_1400, base: "ARS", quote: "ARS" };
    expect(rateApplies(arsOnly, "USD", "ARS")).toBe(false);
  });
});

describe("parseRateInput", () => {
  it("lee el convenio argentino", () => {
    expect(parseRateInput("1.400,50")).toBe(1_400_500_000n);
    expect(parseRateInput("1400,50")).toBe(1_400_500_000n);
    expect(parseRateInput("1.400")).toBe(1_400n * RATE_SCALE);
    expect(parseRateInput("$ 1.400,50")).toBe(1_400_500_000n);
  });

  it("lee un punto decimal de teclado numérico", () => {
    expect(parseRateInput("1400.5")).toBe(1_400_500_000n);
  });

  it("admite hasta seis decimales, que es la escala que guarda", () => {
    expect(parseRateInput("0,000001")).toBe(1n);
    expect(parseRateInput("0,0000001")).toBeNull();
  });

  it("rechaza lo que no es una cotización usable", () => {
    expect(parseRateInput("")).toBeNull();
    expect(parseRateInput("gratis")).toBeNull();
    expect(parseRateInput("0")).toBeNull();
    expect(parseRateInput("-1400")).toBeNull();
  });
});

describe("formatRate", () => {
  it("muestra siempre al menos dos decimales", () => {
    expect(formatRate(1_400n * RATE_SCALE)).toBe("1.400,00");
    expect(formatRate(1_400_500_000n)).toBe("1.400,50");
  });

  it("no arrastra ceros que no aportan", () => {
    expect(formatRate(1_400_123_400n)).toBe("1.400,1234");
  });

  it("es el inverso exacto de la lectura", () => {
    for (const text of ["1.400,00", "1.400,50", "0,25", "987.654,321"]) {
      expect(formatRate(parseRateInput(text)!)).toBe(text);
    }
  });
});

describe("catálogos", () => {
  it("reconoce solo lo que el producto sabe cotizar", () => {
    expect(isSupportedCurrency("ARS")).toBe(true);
    expect(isSupportedCurrency("USD")).toBe(true);
    expect(isSupportedCurrency("BTC")).toBe(false);
    expect(isSupportedCurrency("ars")).toBe(false);
  });

  it("reconoce los tipos de cambio declarados", () => {
    expect(isFxVariant("BLUE")).toBe(true);
    expect(isFxVariant("PARALELO")).toBe(false);
  });
});
