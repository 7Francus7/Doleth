import { describe, expect, it } from "vitest";
import {
  MAX_AMOUNT_CENTS,
  centsToCanonical,
  centsToInputValue,
  formatCentsAR,
  parseAmountInput,
} from "./amount";
import { parseMoneyToCents } from "./domain";

const cents = (input: string) => parseAmountInput(input).cents;
const error = (input: string) => parseAmountInput(input).error;

describe("parseAmountInput: lo que la gente escribe", () => {
  it("lee un número pelado", () => {
    expect(cents("12500")).toBe(1_250_000n);
  });

  it("lee el punto como separador de miles, que es lo que rompía antes", () => {
    expect(cents("12.500")).toBe(1_250_000n);
    expect(cents("1.234.567")).toBe(123_456_700n);
  });

  it("lee el símbolo de peso y los espacios", () => {
    expect(cents("$12.500")).toBe(1_250_000n);
    expect(cents("12 500")).toBe(1_250_000n);
    expect(cents("  $ 12.500  ")).toBe(1_250_000n);
  });

  it("lee la coma como decimal", () => {
    expect(cents("12.500,50")).toBe(1_250_050n);
    expect(cents("12500,5")).toBe(1_250_050n);
    expect(cents("0,99")).toBe(99n);
  });

  it("lee un punto decimal cuando no puede ser miles", () => {
    expect(cents("12.5")).toBe(1_250n);
    expect(cents("12.55")).toBe(1_255n);
  });

  it("acepta millones", () => {
    expect(cents("1.500.000")).toBe(150_000_000n);
  });

  it("no exige centavos", () => {
    expect(cents("300")).toBe(30_000n);
  });
});

describe("parseAmountInput: casos que deben fallar con motivo", () => {
  it("distingue vacío de cero", () => {
    expect(error("")).toBe("empty");
    expect(error("   ")).toBe("empty");
    expect(error("0")).toBe("zero");
    expect(error("0,00")).toBe("zero");
  });

  it("rechaza negativos", () => {
    expect(error("-100")).toBe("negative");
  });

  it("rechaza letras y basura", () => {
    expect(error("abc")).toBe("invalid");
    expect(error("12a")).toBe("invalid");
    expect(error("--")).toBe("negative");
  });

  it("rechaza separadores repetidos o inconsistentes", () => {
    expect(error("12,5,5")).toBe("invalid");
    expect(error("1.23.4")).toBe("invalid");
  });

  it("rechaza más de dos decimales", () => {
    expect(error("12,555")).toBe("invalid");
  });

  it("rechaza importes por encima del máximo", () => {
    expect(error("9999999999999")).toBe("too-large");
    expect(parseAmountInput(formatCentsAR(MAX_AMOUNT_CENTS)).cents).toBe(MAX_AMOUNT_CENTS);
  });
});

describe("formato argentino", () => {
  it("agrupa miles y omite centavos cuando son cero", () => {
    expect(formatCentsAR(1_250_000n)).toBe("12.500");
    expect(formatCentsAR(150_000_000n)).toBe("1.500.000");
    expect(formatCentsAR(30_000n)).toBe("300");
  });

  it("muestra centavos cuando aportan", () => {
    expect(formatCentsAR(1_250_050n)).toBe("12.500,50");
    expect(formatCentsAR(99n)).toBe("0,99");
  });

  it("ida y vuelta estable", () => {
    for (const value of [1n, 99n, 30_000n, 1_250_050n, 150_000_000n, MAX_AMOUNT_CENTS]) {
      expect(parseAmountInput(centsToInputValue(value)).cents).toBe(value);
    }
  });
});

describe("valor canónico enviado al servidor", () => {
  it("usa punto decimal y dos decimales", () => {
    expect(centsToCanonical(1_250_000n)).toBe("12500.00");
    expect(centsToCanonical(1_250_050n)).toBe("12500.50");
    expect(centsToCanonical(99n)).toBe("0.99");
  });

  it("el dominio lo lee sin cambios: mismo importe de punta a punta", () => {
    for (const written of ["12.500", "$12.500", "12 500", "12.500,50", "300", "0,99"]) {
      const reading = parseAmountInput(written);
      expect(reading.cents).not.toBeNull();
      expect(parseMoneyToCents(centsToCanonical(reading.cents!))).toBe(reading.cents);
    }
  });

  it("no usa punto flotante: importes grandes conservan cada centavo", () => {
    const huge = 90_071_992_547n;
    expect(parseMoneyToCents(centsToCanonical(huge))).toBe(huge);
  });
});
