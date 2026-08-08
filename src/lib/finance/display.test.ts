import { describe, expect, it } from "vitest";
import { RATE_SCALE, type ExchangeRate } from "./currency";
import { describeEquivalent, describeMissing, describeRate, valueAmounts } from "./display";
import type { ResolvedRateBook } from "./rates/store";

/**
 * El borde entre el ledger multimoneda y la pantalla.
 *
 * Lo que se prueba acá no es la aritmética —eso ya lo cubre `valuation`— sino la
 * obligación de declarar: que un importe sin cotización nunca desaparezca del
 * total sin que el contexto lo diga.
 */

const NOW = new Date("2026-08-08T12:00:00.000Z");

const rate = (rateMicros: bigint, asOf = "2026-08-08T09:00:00.000Z"): ExchangeRate => ({
  base: "USD",
  quote: "ARS",
  rateMicros,
  variant: "BLUE",
  asOf: new Date(asOf),
  provider: "prueba",
});

const book = (active: ExchangeRate | null, displayCurrency: "ARS" | "USD" = "ARS"): ResolvedRateBook => ({
  displayCurrency,
  variant: active?.variant ?? "BLUE",
  active,
  stale: false,
  rates: active ? [active] : [],
});

const AT_1400 = rate(1_400n * RATE_SCALE);

describe("valueAmounts", () => {
  it("convierte cada saldo y conserva el orden de entrada", () => {
    const { valued } = valueAmounts(
      [
        { balanceCents: 100_000n, currency: "ARS" },
        { balanceCents: 10_000n, currency: "USD" },
        { balanceCents: 50_000n, currency: "ARS" },
      ],
      book(AT_1400),
      NOW,
    );
    expect(valued).toEqual([100_000n, 14_000_000n, 50_000n]);
  });

  it("lee el mismo patrimonio en dólares", () => {
    const { valued, context } = valueAmounts(
      [{ balanceCents: 14_000_000n, currency: "ARS" }],
      book(AT_1400, "USD"),
      NOW,
    );
    expect(valued).toEqual([10_000n]);
    expect(context.symbol).toBe("US$");
  });

  /**
   * La invariante central del archivo: sin cotización el saldo entra al cálculo
   * como cero —no hay otra forma de que la aritmética cierre— y por eso el
   * contexto tiene que decir que el total está incompleto. Un cero silencioso
   * sería un patrimonio falso presentado como verdadero.
   */
  it("un saldo sin cotización entra como cero pero queda declarado", () => {
    const { valued, context } = valueAmounts(
      [
        { balanceCents: 100_000n, currency: "ARS" },
        { balanceCents: 10_000n, currency: "USD" },
      ],
      book(null),
      NOW,
    );
    expect(valued).toEqual([100_000n, 0n]);
    expect(context.complete).toBe(false);
    expect(context.missing).toEqual([{ currency: "USD", cents: 10_000n }]);
  });

  it("una moneda que el producto no sabe leer tampoco desaparece en silencio", () => {
    const { valued, context } = valueAmounts(
      [
        { balanceCents: 100_000n, currency: "ARS" },
        { balanceCents: 700n, currency: "BTC" },
      ],
      book(AT_1400),
      NOW,
    );
    expect(valued).toEqual([100_000n, 0n]);
    expect(context.complete).toBe(false);
    expect(context.unreadable).toEqual([{ currency: "BTC", cents: 700n }]);
  });

  it("una lectura sin huecos se declara completa", () => {
    const { context } = valueAmounts([{ balanceCents: 100_000n, currency: "ARS" }], book(AT_1400), NOW);
    expect(context.complete).toBe(true);
    expect(context.missing).toEqual([]);
  });

  it("informa la antigüedad de la cotización usada", () => {
    const { context } = valueAmounts(
      [{ balanceCents: 10_000n, currency: "USD" }],
      book(rate(1_400n * RATE_SCALE, "2026-08-06T09:00:00.000Z")),
      NOW,
    );
    expect(context.rateAgeDays).toBe(2);
    expect(context.rateLabel).toBe("1.400,00");
  });
});

describe("describeRate", () => {
  it("dice la cotización, el tipo de cambio y cuándo es", () => {
    const { context } = valueAmounts([{ balanceCents: 10_000n, currency: "USD" }], book(AT_1400), NOW);
    expect(describeRate(context)).toBe("1 dólar = $1.400,00 (blue), de hoy.");
  });

  it("distingue ayer de hace varios días", () => {
    const ayer = valueAmounts(
      [{ balanceCents: 1n, currency: "USD" }],
      book(rate(1_400n * RATE_SCALE, "2026-08-07T09:00:00.000Z")),
      NOW,
    ).context;
    expect(describeRate(ayer)).toContain("de ayer");

    const antes = valueAmounts(
      [{ balanceCents: 1n, currency: "USD" }],
      book(rate(1_400n * RATE_SCALE, "2026-08-04T09:00:00.000Z")),
      NOW,
    ).context;
    expect(describeRate(antes)).toContain("hace 4 días");
  });

  it("sin cotización no inventa una frase", () => {
    const { context } = valueAmounts([{ balanceCents: 1n, currency: "ARS" }], book(null), NOW);
    expect(describeRate(context)).toBeNull();
  });
});

describe("describeMissing", () => {
  it("dice exactamente cuánto quedó afuera y en qué moneda", () => {
    const { context } = valueAmounts([{ balanceCents: 10_000n, currency: "USD" }], book(null), NOW);
    expect(describeMissing(context)).toBe(
      "Este total no incluye US$ 100 en dólares: falta la cotización para convertirlos.",
    );
  });

  it("no dice nada cuando no falta nada", () => {
    const { context } = valueAmounts([{ balanceCents: 100n, currency: "ARS" }], book(AT_1400), NOW);
    expect(describeMissing(context)).toBeNull();
  });
});

describe("describeEquivalent", () => {
  it("expresa el total en la otra moneda", () => {
    const libro = book(AT_1400);
    const { context } = valueAmounts([{ balanceCents: 14_000_000n, currency: "ARS" }], libro, NOW);
    expect(describeEquivalent(14_000_000n, context, libro)).toBe("US$ 100");
  });

  it("conserva el signo de un total negativo", () => {
    const libro = book(AT_1400);
    const { context } = valueAmounts([{ balanceCents: -14_000_000n, currency: "ARS" }], libro, NOW);
    expect(describeEquivalent(-14_000_000n, context, libro)).toBe("-US$ 100");
  });

  /** Una equivalencia inventada es peor que ninguna. */
  it("sin cotización no ofrece equivalente", () => {
    const libro = book(null);
    const { context } = valueAmounts([{ balanceCents: 14_000_000n, currency: "ARS" }], libro, NOW);
    expect(describeEquivalent(14_000_000n, context, libro)).toBeNull();
  });
});
