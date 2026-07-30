import { afterEach, describe, expect, it } from "vitest";
import { ConfigurationError, accessMode, publicEmailAuthEnabled } from "./config";

const original = process.env.DOLETH_ACCESS_MODE;

afterEach(() => {
  if (original === undefined) delete process.env.DOLETH_ACCESS_MODE;
  else process.env.DOLETH_ACCESS_MODE = original;
});

describe("modo de acceso", () => {
  it("falla cerrado en beta privada cuando la variable falta", () => {
    delete process.env.DOLETH_ACCESS_MODE;
    expect(accessMode()).toBe("private-beta");
    expect(publicEmailAuthEnabled()).toBe(false);
  });

  it("habilita registro y correo sólo con public explícito", () => {
    process.env.DOLETH_ACCESS_MODE = "public";
    expect(accessMode()).toBe("public");
    expect(publicEmailAuthEnabled()).toBe(true);
  });

  it("rechaza valores desconocidos", () => {
    process.env.DOLETH_ACCESS_MODE = "abierto";
    expect(() => accessMode()).toThrowError(ConfigurationError);
  });
});
