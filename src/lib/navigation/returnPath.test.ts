import { describe, expect, it } from "vitest";
import { sanitizeReturnPath } from "./returnPath";

describe("sanitizeReturnPath", () => {
  it("acepta una ruta interna simple", () => {
    expect(sanitizeReturnPath("/movimientos")).toBe("/movimientos");
  });

  it("conserva query params internos", () => {
    const path = "/movimientos?type=EXPENSE&accountId=abc&month=2026-07";
    expect(sanitizeReturnPath(path)).toBe(path);
  });

  it("conserva el hash cuando la ruta es interna", () => {
    expect(sanitizeReturnPath("/movimientos?type=INCOME#total")).toBe("/movimientos?type=INCOME#total");
  });

  it("rechaza esquema de red relativo //", () => {
    expect(sanitizeReturnPath("//evil.com")).toBe("/movimientos");
  });

  it("rechaza URL externa absoluta", () => {
    expect(sanitizeReturnPath("https://evil.com/x")).toBe("/movimientos");
    expect(sanitizeReturnPath("http://evil.com")).toBe("/movimientos");
  });

  it("rechaza esquema javascript:", () => {
    expect(sanitizeReturnPath("javascript:alert(1)")).toBe("/movimientos");
  });

  it("rechaza backslashes crudos y codificados", () => {
    expect(sanitizeReturnPath("/\\evil.com")).toBe("/movimientos");
    expect(sanitizeReturnPath("/x\\y")).toBe("/movimientos");
    expect(sanitizeReturnPath("/%5Cevil.com")).toBe("/movimientos");
  });

  it("rechaza traversal crudo y codificado", () => {
    expect(sanitizeReturnPath("/../secreto")).toBe("/movimientos");
    expect(sanitizeReturnPath("/movimientos/../../etc")).toBe("/movimientos");
    expect(sanitizeReturnPath("/%2E%2E/secreto")).toBe("/movimientos");
  });

  it("rechaza // codificado", () => {
    expect(sanitizeReturnPath("/%2F%2Fevil.com")).toBe("/movimientos");
  });

  it("rechaza codificación malformada", () => {
    expect(sanitizeReturnPath("/movimientos%ZZ")).toBe("/movimientos");
    expect(sanitizeReturnPath("/%E0%A4%A")).toBe("/movimientos");
  });

  it("rechaza caracteres de control", () => {
    expect(sanitizeReturnPath(`/x${String.fromCharCode(10)}y`)).toBe("/movimientos");
    expect(sanitizeReturnPath(`/x${String.fromCharCode(9)}y`)).toBe("/movimientos");
    expect(sanitizeReturnPath(`/x${String.fromCharCode(0)}y`)).toBe("/movimientos");
  });

  it("usa el fallback ante entradas vacías o no string", () => {
    expect(sanitizeReturnPath("")).toBe("/movimientos");
    expect(sanitizeReturnPath("   ")).toBe("/movimientos");
    expect(sanitizeReturnPath(undefined)).toBe("/movimientos");
    expect(sanitizeReturnPath(null)).toBe("/movimientos");
  });

  it("respeta un fallback personalizado", () => {
    expect(sanitizeReturnPath("https://evil.com", "/ahora")).toBe("/ahora");
  });

  it("rechaza rutas relativas sin barra inicial", () => {
    expect(sanitizeReturnPath("movimientos")).toBe("/movimientos");
    expect(sanitizeReturnPath("../x")).toBe("/movimientos");
  });
});
