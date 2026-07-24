import { describe, expect, it } from "vitest";
import {
  hasEnoughHeight,
  isRestorableNavigation,
  isWithinTolerance,
  normalizeListPath,
  parseSavedPosition,
  scrollStorageKey,
} from "./scrollRestoration";

describe("normalizeListPath", () => {
  it("devuelve la ruta pelada cuando no hay filtros", () => {
    expect(normalizeListPath("/movimientos", {})).toBe("/movimientos");
  });

  it("descarta parámetros vacíos o ausentes", () => {
    expect(normalizeListPath("/movimientos", { type: "", accountId: undefined })).toBe("/movimientos");
  });

  it("ordena los parámetros para que el orden de entrada no cambie la identidad", () => {
    const a = normalizeListPath("/movimientos", { type: "EXPENSE", accountId: "abc", month: "2026-07" });
    const b = normalizeListPath("/movimientos", { month: "2026-07", accountId: "abc", type: "EXPENSE" });
    expect(a).toBe(b);
    expect(a).toBe("/movimientos?accountId=abc&month=2026-07&type=EXPENSE");
  });

  it("distingue listas con filtros distintos", () => {
    expect(normalizeListPath("/movimientos", { type: "EXPENSE" })).not.toBe(
      normalizeListPath("/movimientos", { type: "INCOME" }),
    );
  });
});

describe("scrollStorageKey", () => {
  it("deriva la clave de la ruta normalizada", () => {
    expect(scrollStorageKey("/movimientos?type=EXPENSE")).toBe("doleth:scroll:/movimientos?type=EXPENSE");
  });

  it("da claves distintas para filtros distintos", () => {
    expect(scrollStorageKey("/movimientos?type=EXPENSE")).not.toBe(scrollStorageKey("/movimientos?type=INCOME"));
  });
});

describe("parseSavedPosition", () => {
  it("acepta una posición positiva", () => {
    expect(parseSavedPosition("742")).toBe(742);
  });

  it("redondea valores fraccionarios", () => {
    expect(parseSavedPosition("742.6")).toBe(743);
  });

  it("ignora ausencia, cero, negativos y basura", () => {
    expect(parseSavedPosition(null)).toBeNull();
    expect(parseSavedPosition("0")).toBeNull();
    expect(parseSavedPosition("-40")).toBeNull();
    expect(parseSavedPosition("arriba")).toBeNull();
    expect(parseSavedPosition("")).toBeNull();
  });
});

describe("hasEnoughHeight", () => {
  it("permite restaurar cuando la lista alcanza la posición", () => {
    expect(hasEnoughHeight(3760, 889, 800)).toBe(true);
  });

  it("no restaura si la lista quedó más corta que la posición guardada", () => {
    expect(hasEnoughHeight(900, 889, 800)).toBe(false);
  });

  it("acepta el límite exacto", () => {
    expect(hasEnoughHeight(1689, 889, 800)).toBe(true);
  });
});

describe("isRestorableNavigation", () => {
  it("acepta el click primario sin modificadores", () => {
    expect(isRestorableNavigation({ button: 0 })).toBe(true);
  });

  it("ignora click central y secundario", () => {
    expect(isRestorableNavigation({ button: 1 })).toBe(false);
    expect(isRestorableNavigation({ button: 2 })).toBe(false);
  });

  it("ignora modificadores que abren en otra pestaña o ventana", () => {
    expect(isRestorableNavigation({ button: 0, metaKey: true })).toBe(false);
    expect(isRestorableNavigation({ button: 0, ctrlKey: true })).toBe(false);
    expect(isRestorableNavigation({ button: 0, shiftKey: true })).toBe(false);
    expect(isRestorableNavigation({ button: 0, altKey: true })).toBe(false);
  });

  it("ignora un evento ya cancelado", () => {
    expect(isRestorableNavigation({ button: 0, defaultPrevented: true })).toBe(false);
  });

  it("acepta activación por teclado, que llega sin botón", () => {
    expect(isRestorableNavigation({})).toBe(true);
  });
});

describe("isWithinTolerance", () => {
  it("admite pequeñas variaciones de layout", () => {
    expect(isWithinTolerance(718, 742)).toBe(true);
    expect(isWithinTolerance(742, 742)).toBe(true);
  });

  it("rechaza una diferencia mayor a la tolerancia", () => {
    expect(isWithinTolerance(500, 742)).toBe(false);
  });
});
