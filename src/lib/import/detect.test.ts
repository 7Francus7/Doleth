import { describe, expect, it } from "vitest";
import { detectColumns, looksLikeHeader, toMapping, validateMapping } from "./detect";

const roleAt = (columns: ReturnType<typeof detectColumns>["columns"], index: number) =>
  columns.find((column) => column.index === index)?.role;

describe("looksLikeHeader", () => {
  it("reconoce una fila de etiquetas", () => {
    expect(looksLikeHeader(["Fecha", "Descripcion", "Importe"])).toBe(true);
  });

  it("no confunde una fila de datos con un encabezado", () => {
    expect(looksLikeHeader(["01/08/2026", "Coto", "-1.234,56"])).toBe(false);
  });

  it("una fila de una sola celda no es un encabezado", () => {
    expect(looksLikeHeader(["Banco Ejemplo"])).toBe(false);
  });
});

describe("detectColumns", () => {
  it("usa el encabezado cuando el archivo lo trae", () => {
    const { hasHeader, columns } = detectColumns([
      ["Fecha", "Descripción", "Importe"],
      ["01/08/2026", "COTO CICSA", "-1.234,56"],
      ["02/08/2026", "SUELDO", "850.000,00"],
    ]);
    expect(hasHeader).toBe(true);
    expect(roleAt(columns, 0)).toBe("date");
    expect(roleAt(columns, 1)).toBe("description");
    expect(roleAt(columns, 2)).toBe("amount");
    expect(columns.every((column) => column.confidence === "high" || column.role === "ignore")).toBe(true);
  });

  /**
   * Dos columnas de importes son indistinguibles por contenido: los dos lados
   * son números positivos. El encabezado lo resuelve de una.
   */
  it("reconoce el par débito y crédito", () => {
    const { columns } = detectColumns([
      ["Fecha", "Detalle", "Débito", "Crédito"],
      ["01/08/2026", "COTO", "1.234,56", ""],
      ["02/08/2026", "SUELDO", "", "850.000,00"],
    ]);
    expect(roleAt(columns, 2)).toBe("debit");
    expect(roleAt(columns, 3)).toBe("credit");
  });

  it("reconoce encabezados en inglés", () => {
    const { columns } = detectColumns([
      ["Date", "Description", "Amount"],
      ["2026-08-01", "COTO", "-1234.56"],
    ]);
    expect(roleAt(columns, 0)).toBe("date");
    expect(roleAt(columns, 1)).toBe("description");
    expect(roleAt(columns, 2)).toBe("amount");
  });

  /**
   * Un archivo sin encabezado deja la detección por nombre sin nada, y el
   * contenido siempre está.
   */
  it("infiere por contenido cuando no hay encabezado", () => {
    const { hasHeader, columns } = detectColumns([
      ["01/08/2026", "COTO CICSA", "-1.234,56"],
      ["02/08/2026", "SHELL ESTACION", "-8.000,00"],
      ["03/08/2026", "SUELDO MENSUAL", "850.000,00"],
    ]);
    expect(hasHeader).toBe(false);
    expect(roleAt(columns, 0)).toBe("date");
    expect(roleAt(columns, 1)).toBe("description");
    expect(roleAt(columns, 2)).toBe("amount");
  });

  it("la segunda columna de fechas se lee como fecha de imputación", () => {
    const { columns } = detectColumns([
      ["01/08/2026", "05/08/2026", "COTO", "-1.234,56"],
      ["02/08/2026", "06/08/2026", "SHELL", "-8.000,00"],
    ]);
    expect(roleAt(columns, 0)).toBe("date");
    expect(roleAt(columns, 1)).toBe("postedDate");
  });

  it("reconoce el saldo y no lo confunde con el importe", () => {
    const { columns } = detectColumns([
      ["Fecha", "Detalle", "Importe", "Saldo"],
      ["01/08/2026", "COTO", "-1.234,56", "98.765,44"],
    ]);
    expect(roleAt(columns, 2)).toBe("amount");
    expect(roleAt(columns, 3)).toBe("balance");
  });

  /**
   * Una columna llamada "Importe" que no contiene importes no es la de importes.
   * Insistir con el nombre sería confiar en la etiqueta contra la evidencia.
   */
  it("baja la confianza cuando el nombre y el contenido no coinciden", () => {
    const { columns } = detectColumns([
      ["Fecha", "Importe"],
      ["01/08/2026", "no disponible"],
      ["02/08/2026", "tampoco"],
    ]);
    expect(columns.find((column) => column.index === 1)?.confidence).toBe("low");
  });

  /**
   * Dos columnas con el mismo rol romperían el mapeo en silencio: la segunda
   * pisaría a la primera.
   */
  it("deja un solo dueño por rol excluyente", () => {
    const { columns } = detectColumns([
      ["Importe", "Monto"],
      ["-1.234,56", "-1.234,56"],
      ["-8.000,00", "-8.000,00"],
    ]);
    expect(columns.filter((column) => column.role === "amount")).toHaveLength(1);
  });

  it("un archivo vacío no rompe", () => {
    expect(detectColumns([]).columns).toEqual([]);
  });
});

describe("toMapping", () => {
  it("arma el mapeo salteando lo ignorado", () => {
    const { columns } = detectColumns([
      ["Fecha", "Detalle", "Importe", "Saldo"],
      ["01/08/2026", "COTO", "-1.234,56", "98.765,44"],
    ]);
    expect(toMapping(columns)).toEqual({ date: 0, description: 1, amount: 2, balance: 3 });
  });
});

describe("validateMapping", () => {
  it("acepta un mapeo con importe firmado", () => {
    expect(validateMapping({ date: 0, description: 1, amount: 2 })).toEqual([]);
  });

  it("acepta un mapeo con débito y crédito", () => {
    expect(validateMapping({ date: 0, description: 1, debit: 2, credit: 3 })).toEqual([]);
  });

  /** Los problemas se devuelven todos juntos: de a uno obliga a adivinar. */
  it("junta todo lo que falta en una sola respuesta", () => {
    expect(validateMapping({})).toHaveLength(3);
  });

  it("sin descripción no alcanza, aunque haya fecha e importe", () => {
    const problems = validateMapping({ date: 0, amount: 1 });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("descripción");
  });
});
