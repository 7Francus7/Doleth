import { describe, expect, it } from "vitest";
import {
  archiveCategoryProblem,
  categoryNameProblem,
  isCategoryKind,
  isDuplicateCategoryName,
  normalizeCategoryName,
  slugifyCategoryName,
  uniqueCategorySlug,
} from "./categoryRules";

describe("normalizeCategoryName", () => {
  it("recorta las puntas y colapsa espacios internos", () => {
    expect(normalizeCategoryName("  Gastos   del   auto  ")).toBe("Gastos del auto");
  });

  it("conserva las mayúsculas que la persona escribió", () => {
    expect(normalizeCategoryName("IVA")).toBe("IVA");
    expect(normalizeCategoryName("obra social")).toBe("obra social");
  });

  it("saca los caracteres de control sin dejar el nombre pegado", () => {
    expect(normalizeCategoryName("Luz\ty\ngas")).toBe("Luz y gas");
    expect(normalizeCategoryName(`Alquiler${String.fromCharCode(0)}`)).toBe("Alquiler");
  });
});

describe("categoryNameProblem", () => {
  it("acepta un nombre común", () => {
    expect(categoryNameProblem("Farmacia")).toBeNull();
  });

  it("rechaza uno demasiado corto", () => {
    expect(categoryNameProblem("A")).toMatch(/dos caracteres/);
  });

  it("rechaza uno demasiado largo", () => {
    expect(categoryNameProblem("x".repeat(41))).toMatch(/40 caracteres/);
  });

  it("rechaza un nombre sin letras ni números", () => {
    expect(categoryNameProblem("...")).toMatch(/letra o un número/);
  });

  it("acepta un nombre con emoji siempre que tenga texto", () => {
    expect(categoryNameProblem("🏠 Casa")).toBeNull();
  });
});

describe("slugifyCategoryName", () => {
  it("baja a minúsculas y une con guiones", () => {
    expect(slugifyCategoryName("Gastos del auto")).toBe("gastos-del-auto");
  });

  it("pliega los acentos para que Pádel y Padel no sean dos slugs distintos", () => {
    expect(slugifyCategoryName("Pádel")).toBe(slugifyCategoryName("Padel"));
  });

  it("no deja guiones colgando en las puntas", () => {
    expect(slugifyCategoryName("¡Salidas!")).toBe("salidas");
  });

  it("le da un slug propio a un nombre sin letras latinas", () => {
    expect(slugifyCategoryName("日常")).toBe("categoria");
  });
});

describe("uniqueCategorySlug", () => {
  it("devuelve el slug pedido cuando está libre", () => {
    expect(uniqueCategorySlug("auto", ["comida", "transporte"])).toBe("auto");
  });

  it("numera desde el 2 cuando ya existe", () => {
    expect(uniqueCategorySlug("auto", ["auto"])).toBe("auto-2");
    expect(uniqueCategorySlug("auto", ["auto", "auto-2"])).toBe("auto-3");
  });

  it("no reusa un hueco intermedio ocupado", () => {
    expect(uniqueCategorySlug("auto", ["auto", "auto-3"])).toBe("auto-2");
  });
});

describe("isDuplicateCategoryName", () => {
  it("detecta el mismo nombre con otras mayúsculas", () => {
    expect(isDuplicateCategoryName("comida", ["Comida"])).toBe(true);
  });

  it("detecta el mismo nombre con y sin acento", () => {
    expect(isDuplicateCategoryName("Padel", ["Pádel"])).toBe(true);
  });

  it("deja pasar dos nombres realmente distintos", () => {
    expect(isDuplicateCategoryName("Comida", ["Comidas afuera"])).toBe(false);
  });
});

describe("archiveCategoryProblem", () => {
  it("permite archivar una categoría común en uso", () => {
    expect(archiveCategoryProblem({ slug: "padel", archivedAt: null })).toBeNull();
  });

  it("protege la categoría de respaldo", () => {
    expect(archiveCategoryProblem({ slug: "other-expense", archivedAt: null })).toMatch(/respaldo/);
  });

  it("no archiva dos veces la misma", () => {
    expect(archiveCategoryProblem({ slug: "padel", archivedAt: new Date() })).toMatch(/ya está archivada/);
  });
});

describe("isCategoryKind", () => {
  it("reconoce los dos tipos del dominio", () => {
    expect(isCategoryKind("INCOME")).toBe(true);
    expect(isCategoryKind("EXPENSE")).toBe(true);
  });

  it("rechaza cualquier otra cosa, incluido el tipo de un movimiento", () => {
    expect(isCategoryKind("TRANSFER")).toBe(false);
    expect(isCategoryKind("")).toBe(false);
  });
});
