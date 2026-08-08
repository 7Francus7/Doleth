import { describe, expect, it } from "vitest";
import { buildImportPlan, suggestsInvertedSign, type BuildPlanInput } from "./plan";

const base: Omit<BuildPlanInput, "rows"> = {
  mapping: { date: 0, description: 1, amount: 2 },
  dateOrder: "DMY",
  signConvention: "negative-is-expense",
};

const plan = (rows: string[][], overrides: Partial<BuildPlanInput> = {}) =>
  buildImportPlan({ ...base, rows, ...overrides });

describe("buildImportPlan", () => {
  it("convierte cada fila en un movimiento propuesto", () => {
    const result = plan([
      ["01/08/2026", "COTO CICSA", "-1.234,56"],
      ["02/08/2026", "SUELDO", "850.000,00"],
    ]);

    expect(result.usableCount).toBe(2);
    expect(result.rows[0]).toMatchObject({
      sourceRowNumber: 1,
      day: "2026-08-01",
      amountCents: -123_456n,
      type: "EXPENSE",
      merchant: "Coto Cicsa",
    });
    expect(result.rows[1]?.type).toBe("INCOME");
  });

  it("suma los totales para poder cotejarlos con el resumen", () => {
    const result = plan([
      ["01/08/2026", "COTO", "-1.000,00"],
      ["02/08/2026", "SHELL", "-500,00"],
      ["03/08/2026", "SUELDO", "850.000,00"],
    ]);
    expect(result.expenseCents).toBe(150_000n);
    expect(result.incomeCents).toBe(85_000_000n);
    expect(result.firstDay).toBe("2026-08-01");
    expect(result.lastDay).toBe("2026-08-03");
  });

  describe("par débito y crédito", () => {
    /** El par dice el sentido por sí mismo: no depende de ninguna convención. */
    it("el lado lleno determina el sentido", () => {
      const result = plan(
        [
          ["01/08/2026", "COTO", "1.234,56", ""],
          ["02/08/2026", "SUELDO", "", "850.000,00"],
        ],
        { mapping: { date: 0, description: 1, debit: 2, credit: 3 } },
      );
      expect(result.rows[0]?.type).toBe("EXPENSE");
      expect(result.rows[0]?.amountCents).toBe(-123_456n);
      expect(result.rows[1]?.type).toBe("INCOME");
    });

    it("ignora la convención de signo, que ahí no aplica", () => {
      const result = plan(
        [["01/08/2026", "COTO", "1.234,56", ""]],
        { mapping: { date: 0, description: 1, debit: 2, credit: 3 }, signConvention: "positive-is-expense" },
      );
      expect(result.rows[0]?.amountCents).toBe(-123_456n);
    });

    it("una fila con las dos columnas vacías queda sin importe", () => {
      const result = plan(
        [["01/08/2026", "AJUSTE", "", ""]],
        { mapping: { date: 0, description: 1, debit: 2, credit: 3 } },
      );
      expect(result.rows[0]?.issues).toContain("amount-missing");
    });
  });

  describe("convención de signo", () => {
    /**
     * Un resumen de tarjeta escribe los consumos en positivo: desde la óptica de
     * la tarjeta son deuda que sube.
     */
    it("invierte cuando el archivo es un resumen de tarjeta", () => {
      const result = plan([["01/08/2026", "COTO", "1.234,56"]], { signConvention: "positive-is-expense" });
      expect(result.rows[0]?.type).toBe("EXPENSE");
      expect(result.rows[0]?.amountCents).toBe(-123_456n);
    });
  });

  describe("filas con problemas", () => {
    /** Nunca se descartan calladas: se muestran con su motivo. */
    it("declara cada problema en vez de saltear la fila", () => {
      const result = plan([
        ["", "COTO", "-1.000,00"],
        ["32/13/2026", "SHELL", "-500,00"],
        ["03/08/2026", "ALGO", "no disponible"],
        ["04/08/2026", "", "-100,00"],
        ["05/08/2026", "AJUSTE", "0,00"],
      ]);

      expect(result.rows).toHaveLength(5);
      expect(result.rows[0]?.issues).toContain("date-missing");
      expect(result.rows[1]?.issues).toContain("date-invalid");
      expect(result.rows[2]?.issues).toContain("amount-invalid");
      expect(result.rows[3]?.issues).toContain("description-missing");
      expect(result.rows[4]?.issues).toContain("amount-zero");
      expect(result.usableCount).toBe(0);
      expect(result.brokenCount).toBe(5);
    });

    it("una fila rota no arrastra a las sanas", () => {
      const result = plan([
        ["01/08/2026", "COTO", "-1.000,00"],
        ["basura", "", ""],
        ["03/08/2026", "SHELL", "-500,00"],
      ]);
      expect(result.usableCount).toBe(2);
    });
  });

  describe("duplicados", () => {
    it("reconoce lo que ya está en el ledger", () => {
      const result = plan([["01/08/2026", "COTO CICSA", "-1.234,56"]], {
        existing: [{ day: "2026-08-01", amountCents: -123_456n, description: "COMPRA EN COTO CICSA" }],
      });
      expect(result.rows[0]?.duplicate).toBe("existing");
      expect(result.usableCount).toBe(0);
      expect(result.duplicateCount).toBe(1);
    });

    /**
     * El banco escribe el mismo consumo distinto en el extracto y en el resumen.
     * Comparar el texto crudo dejaría pasar el duplicado justo cuando importa.
     */
    it("compara el comercio normalizado y no el texto crudo", () => {
      const result = plan([["01/08/2026", "MERPAGO*COTO CICSA 0345", "-1.234,56"]], {
        existing: [{ day: "2026-08-01", amountCents: -123_456n, description: "COTO CICSA" }],
      });
      expect(result.rows[0]?.duplicate).toBe("existing");
    });

    it("reconoce una fila repetida dentro del propio archivo", () => {
      const result = plan([
        ["01/08/2026", "COTO", "-1.234,56"],
        ["01/08/2026", "COTO", "-1.234,56"],
      ]);
      expect(result.rows[0]?.duplicate).toBeNull();
      expect(result.rows[1]?.duplicate).toBe("within-file");
      expect(result.usableCount).toBe(1);
    });

    it("dos compras iguales en días distintos no son duplicado", () => {
      const result = plan([
        ["01/08/2026", "COTO", "-1.234,56"],
        ["02/08/2026", "COTO", "-1.234,56"],
      ]);
      expect(result.usableCount).toBe(2);
    });
  });

  describe("comercio y cuotas", () => {
    it("separa procesador, comercio y cuota", () => {
      const result = plan([["01/08/2026", "MERPAGO*FRAVEGA C.03/12", "-1.234,56"]]);
      expect(result.rows[0]).toMatchObject({
        processor: "Mercado Pago",
        merchant: "Fravega",
        installment: { number: 3, total: 12 },
      });
    });

    it("conserva el texto original de cada fila", () => {
      const result = plan([["01/08/2026", "MERPAGO*FRAVEGA C.03/12", "-1.234,56"]]);
      expect(result.rows[0]?.rawDescription).toBe("MERPAGO*FRAVEGA C.03/12");
      expect(result.rows[0]?.cells).toEqual(["01/08/2026", "MERPAGO*FRAVEGA C.03/12", "-1.234,56"]);
    });
  });

  it("un archivo sin filas produce un plan vacío y coherente", () => {
    const result = plan([]);
    expect(result).toMatchObject({ usableCount: 0, brokenCount: 0, expenseCents: 0n, firstDay: null });
  });
});

describe("suggestsInvertedSign", () => {
  /** Nadie tiene un resumen con noventa ingresos y dos gastos. */
  it("avisa cuando casi todo quedó como ingreso", () => {
    const rows = Array.from({ length: 10 }, (_, index) => [`0${(index % 9) + 1}/08/2026`, `COMERCIO ${index}`, "1.000,00"]);
    expect(suggestsInvertedSign(plan(rows))).toBe(true);
  });

  it("no avisa ante una mezcla normal", () => {
    const rows = [
      ["01/08/2026", "COTO", "-1.000,00"],
      ["02/08/2026", "SHELL", "-500,00"],
      ["03/08/2026", "FARMACIA", "-800,00"],
      ["04/08/2026", "LIBRERIA", "-300,00"],
      ["05/08/2026", "SUELDO", "850.000,00"],
    ];
    expect(suggestsInvertedSign(plan(rows))).toBe(false);
  });

  /** Con pocas filas no hay evidencia suficiente para afirmar nada. */
  it("no opina sobre un archivo demasiado chico", () => {
    expect(suggestsInvertedSign(plan([["01/08/2026", "SUELDO", "850.000,00"]]))).toBe(false);
  });
});
