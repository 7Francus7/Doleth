import { describe, expect, it } from "vitest";
import { RATE_SCALE } from "./currency";
import {
  QUANTITY_SCALE,
  formatQuantity,
  parseQuantityInput,
  valueHolding,
  valueOfQuantity,
  valuePortfolio,
  weightBasisPoints,
  type Holding,
  type UnitPrice,
} from "./holdings";

const holding = (overrides: Partial<Holding> = {}): Holding => ({
  id: "h1",
  name: "Acciones",
  kind: "STOCKS",
  currency: "ARS",
  investedCents: 100_000_00n,
  quantityMicros: 10n * QUANTITY_SCALE,
  symbol: "AAPL",
  declaredValueCents: 0n,
  ...overrides,
});

const price = (overrides: Partial<UnitPrice> = {}): UnitPrice => ({
  symbol: "AAPL",
  currency: "ARS",
  priceMicros: 15_000n * RATE_SCALE,
  asOf: new Date("2026-08-08T12:00:00.000Z"),
  provider: "prueba",
  ...overrides,
});

describe("valueOfQuantity", () => {
  it("multiplica cantidad por precio y devuelve centavos", () => {
    // 10 unidades a $1.500,00 son $15.000,00.
    expect(valueOfQuantity(10n * QUANTITY_SCALE, 1_500n * RATE_SCALE)).toBe(1_500_000n);
  });

  it("no pierde precisión con fracciones de cripto", () => {
    // 0,5 unidades a $80.000.000,00.
    expect(valueOfQuantity(QUANTITY_SCALE / 2n, 80_000_000n * RATE_SCALE)).toBe(4_000_000_000n);
  });

  it("redondea al centavo en vez de truncar", () => {
    // 3 unidades a $0,335 son $1,005 → $1,01.
    expect(valueOfQuantity(3n * QUANTITY_SCALE, 335_000n)).toBe(101n);
  });

  it("una cantidad de cero vale cero", () => {
    expect(valueOfQuantity(0n, 15_000n * RATE_SCALE)).toBe(0n);
  });
});

describe("valueHolding", () => {
  it("valúa por cantidad y precio de mercado", () => {
    const result = valueHolding(holding(), price());
    expect(result.valueCents).toBe(15_000_000n);
    expect(result.mode).toBe("market");
    expect(result.resultCents).toBe(5_000_000n);
    expect(result.returnBasisPoints).toBe(5_000);
  });

  it("distingue un precio propio de uno del mercado", () => {
    const result = valueHolding(holding(), price({ provider: null }));
    expect(result.mode).toBe("manual-price");
  });

  /**
   * Un departamento no tiene cotización, y forzarlo a tener cantidad y precio
   * unitario sería inventar precisión.
   */
  it("una tenencia sin cantidad conserva su valor declarado", () => {
    const result = valueHolding(
      holding({ quantityMicros: null, symbol: null, declaredValueCents: 90_000_000n }),
      null,
    );
    expect(result.valueCents).toBe(90_000_000n);
    expect(result.mode).toBe("declared");
  });

  /**
   * Sin precio no se muestra cero: se cae al último valor cargado y el modo lo
   * declara, para que la pantalla pueda avisar que ese número no es de hoy.
   */
  it("sin precio cae al valor declarado en vez de mostrar cero", () => {
    const result = valueHolding(holding({ declaredValueCents: 12_000_000n }), null);
    expect(result.valueCents).toBe(12_000_000n);
    expect(result.mode).toBe("declared");
  });

  it("sin nada invertido no inventa un rendimiento", () => {
    const result = valueHolding(holding({ investedCents: 0n }), price());
    expect(result.returnBasisPoints).toBeNull();
  });

  it("informa una pérdida con su signo", () => {
    const result = valueHolding(holding({ investedCents: 20_000_000n }), price());
    expect(result.resultCents).toBe(-5_000_000n);
    expect(result.returnBasisPoints).toBe(-2_500);
  });
});

describe("valuePortfolio", () => {
  const prices = new Map<string, UnitPrice>([["AAPL", price()]]);

  it("suma la cartera y calcula el rendimiento total", () => {
    const portfolio = valuePortfolio(
      [
        holding({ id: "a" }),
        holding({ id: "b", symbol: null, quantityMicros: null, investedCents: 50_000_00n, declaredValueCents: 60_000_00n }),
      ],
      prices,
    );
    expect(portfolio.totalValueCents).toBe(15_000_000n + 6_000_000n);
    expect(portfolio.totalInvestedCents).toBe(15_000_000n);
    expect(portfolio.totalResultCents).toBe(6_000_000n);
    expect(portfolio.marketCount).toBe(1);
    expect(portfolio.declaredCount).toBe(1);
  });

  /**
   * Un precio en dólares aplicado a una tenencia en pesos daría un valor
   * multiplicado por mil sin que nada falle visiblemente. La moneda se verifica.
   */
  it("no aplica un precio de otra moneda", () => {
    const portfolio = valuePortfolio(
      [holding({ currency: "USD", declaredValueCents: 7n })],
      new Map([["AAPL", price({ currency: "ARS" })]]),
    );
    expect(portfolio.holdings[0]?.mode).toBe("declared");
    expect(portfolio.holdings[0]?.valueCents).toBe(7n);
  });

  it("declara los símbolos que quedaron sin precio", () => {
    const portfolio = valuePortfolio([holding({ symbol: "MELI" })], prices);
    expect(portfolio.missingPrices).toEqual(["MELI"]);
  });

  it("una tenencia sin símbolo no se cuenta como precio faltante", () => {
    const portfolio = valuePortfolio([holding({ symbol: null, quantityMicros: null })], prices);
    expect(portfolio.missingPrices).toEqual([]);
  });

  it("encuentra el símbolo sin importar mayúsculas ni espacios", () => {
    const portfolio = valuePortfolio([holding({ symbol: " aapl " })], prices);
    expect(portfolio.holdings[0]?.mode).toBe("market");
  });

  it("informa el precio más viejo de los que usó", () => {
    const portfolio = valuePortfolio(
      [holding({ id: "a" }), holding({ id: "b", symbol: "MELI" })],
      new Map([
        ["AAPL", price({ asOf: new Date("2026-08-08T00:00:00.000Z") })],
        ["MELI", price({ symbol: "MELI", asOf: new Date("2026-08-01T00:00:00.000Z") })],
      ]),
    );
    expect(portfolio.oldestPriceAsOf).toEqual(new Date("2026-08-01T00:00:00.000Z"));
  });

  it("una cartera vacía no rompe ni inventa rendimiento", () => {
    const portfolio = valuePortfolio([], new Map());
    expect(portfolio.totalValueCents).toBe(0n);
    expect(portfolio.returnBasisPoints).toBeNull();
    expect(portfolio.oldestPriceAsOf).toBeNull();
  });
});

describe("weightBasisPoints", () => {
  it("mide sobre el total valuado, que es lo que hay hoy", () => {
    expect(weightBasisPoints(25_000n, 100_000n)).toBe(2_500);
  });

  it("no divide por cero", () => {
    expect(weightBasisPoints(100n, 0n)).toBe(0);
  });
});

describe("parseQuantityInput", () => {
  it("lee cantidades enteras y fraccionarias", () => {
    expect(parseQuantityInput("10")).toBe(10n * QUANTITY_SCALE);
    expect(parseQuantityInput("0,5")).toBe(QUANTITY_SCALE / 2n);
    expect(parseQuantityInput("0.5")).toBe(QUANTITY_SCALE / 2n);
  });

  /**
   * Una cantidad no lleva separador de miles: tratar el punto como miles
   * rompería "0.5 BTC", que se escribe todo el tiempo.
   */
  it("el punto siempre es decimal en una cantidad", () => {
    expect(parseQuantityInput("1.5")).toBe(1_500_000n);
  });

  it("admite hasta seis decimales", () => {
    expect(parseQuantityInput("0,000001")).toBe(1n);
    expect(parseQuantityInput("0,0000001")).toBeNull();
  });

  it("rechaza lo que no es una cantidad usable", () => {
    expect(parseQuantityInput("")).toBeNull();
    expect(parseQuantityInput("muchas")).toBeNull();
    expect(parseQuantityInput("0")).toBeNull();
    expect(parseQuantityInput("-3")).toBeNull();
    expect(parseQuantityInput(".")).toBeNull();
  });
});

describe("formatQuantity", () => {
  it("no arrastra decimales que no aportan", () => {
    expect(formatQuantity(10n * QUANTITY_SCALE)).toBe("10");
    expect(formatQuantity(1_500_000n)).toBe("1,5");
  });

  it("agrupa los miles", () => {
    expect(formatQuantity(1_234_567n * QUANTITY_SCALE)).toBe("1.234.567");
  });

  it("es el inverso de la lectura", () => {
    // Pares explícitos: lo escrito y su forma canónica. El formateo reagrupa los
    // miles, así que una transformación automática del texto de entrada mentiría.
    const pairs: readonly [string, string][] = [
      ["10", "10"],
      ["1,5", "1,5"],
      ["0,000001", "0,000001"],
      ["1234567", "1.234.567"],
      ["12,345678", "12,345678"],
    ];
    for (const [written, canonical] of pairs) {
      expect(formatQuantity(parseQuantityInput(written)!), written).toBe(canonical);
    }
  });

  /**
   * El punto escrito es decimal, así que "1.234" vuelve como "1,234". Es el
   * comportamiento correcto y conviene tenerlo fijado: el día que alguien crea
   * que el punto agrupa miles, esta prueba se lo dice.
   */
  it("un punto escrito vuelve como coma decimal", () => {
    expect(formatQuantity(parseQuantityInput("1.234")!)).toBe("1,234");
  });
});
