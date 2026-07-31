import { describe, expect, it } from "vitest";
import {
  PRIVATE_DOWNLOAD_HEADERS,
  safeSpreadsheetCell,
  toSemicolonCsv,
} from "./format";

describe("exportación segura", () => {
  it.each(["=SUM(A1:A2)", "+cmd", "-2+3", "@payload"])(
    "neutraliza fórmulas de planilla: %s",
    (value) => expect(safeSpreadsheetCell(value)).toBe(`"'${value}"`),
  );

  it("escapa comillas, usa punto y coma y agrega BOM UTF-8", () => {
    const csv = toSemicolonCsv(["nombre", "nota"], [["Caja", 'Dice "hola"']]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"nombre";"nota"');
    expect(csv).toContain('"Caja";"Dice ""hola"""');
  });

  it("declara descargas privadas sin caché", () => {
    expect(PRIVATE_DOWNLOAD_HEADERS["Cache-Control"]).toContain("no-store");
    expect(PRIVATE_DOWNLOAD_HEADERS["X-Content-Type-Options"]).toBe("nosniff");
  });
});
