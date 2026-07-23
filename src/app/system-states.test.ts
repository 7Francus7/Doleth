import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

describe("error boundaries: copy sobrio y sin tecnicismos", () => {
  it("error.tsx explica sin exponer detalles técnicos", () => {
    const src = read("src/app/error.tsx");
    expect(src).toContain("Doleth no pudo cargar esta pantalla.");
    expect(src).toContain("Tus datos guardados siguen seguros.");
    expect(src).toContain("Reintentar");
    expect(src).toContain("Volver a Ahora");
    // No renderiza el mensaje/stack/digest del error al usuario.
    expect(src).not.toMatch(/\{error\.message\}|\{error\.digest\}|error\.stack/);
    // El log queda restringido a desarrollo.
    expect(src).toContain('process.env.NODE_ENV === "development"');
  });

  it("global-error.tsx es autónomo (html/body) y sobrio", () => {
    const src = read("src/app/global-error.tsx");
    expect(src).toContain('"use client"');
    expect(src).toContain("<html");
    expect(src).toContain("<body");
    expect(src).toContain("Doleth no pudo cargar esta pantalla.");
    expect(src).toContain("Reintentar");
    expect(src).not.toMatch(/\{error\.message\}|error\.stack/);
  });

  it("not-found.tsx tiene copy propia de 404", () => {
    const src = read("src/app/not-found.tsx");
    expect(src).toContain("Esta parte de Doleth no existe.");
    expect(src).toContain("Volver a Ahora");
  });
});

describe("reduced motion: cobertura declarada", () => {
  it("global.css tiene la regla global de prefers-reduced-motion", () => {
    expect(read("src/styles/global.css")).toContain("prefers-reduced-motion: reduce");
  });
  it("el skeleton desactiva el shimmer con reduced motion", () => {
    expect(read("src/design-system/feedback/Skeleton/Skeleton.module.css")).toContain(
      "prefers-reduced-motion: reduce",
    );
  });
  it("el spinner del botón se detiene con reduced motion", () => {
    expect(read("src/design-system/primitives/Button/Button.module.css")).toContain(
      "prefers-reduced-motion: reduce",
    );
  });
});

describe("loading boundaries: rutas dinámicas cubiertas", () => {
  const routes = [
    "ahora",
    "movimientos",
    "movimientos/[id]",
    "proximo",
    "cuentas",
    "inversiones",
    "cambios",
    "progreso",
    "mi-realidad",
    "actuar",
  ];
  for (const route of routes) {
    it(`/${route} tiene loading.tsx`, () => {
      const src = read(`src/app/${route}/loading.tsx`);
      expect(src).toMatch(/Skeleton/);
    });
  }
});
