import { afterEach, describe, expect, it } from "vitest";
import {
  ConfigurationError,
  accessMode,
  emailVerificationRequired,
  publicEmailAuthEnabled,
} from "./config";

const original = process.env.DOLETH_ACCESS_MODE;
const originalVerification = process.env.DOLETH_REQUIRE_EMAIL_VERIFICATION;
const originalVercelEnv = process.env.VERCEL_ENV;
const originalVercelTargetEnv = process.env.VERCEL_TARGET_ENV;

afterEach(() => {
  if (original === undefined) delete process.env.DOLETH_ACCESS_MODE;
  else process.env.DOLETH_ACCESS_MODE = original;
  if (originalVerification === undefined) delete process.env.DOLETH_REQUIRE_EMAIL_VERIFICATION;
  else process.env.DOLETH_REQUIRE_EMAIL_VERIFICATION = originalVerification;
  if (originalVercelEnv === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = originalVercelEnv;
  if (originalVercelTargetEnv === undefined) delete process.env.VERCEL_TARGET_ENV;
  else process.env.VERCEL_TARGET_ENV = originalVercelTargetEnv;
});

describe("verificación de correo", () => {
  it("queda obligatoria por defecto", () => {
    delete process.env.DOLETH_REQUIRE_EMAIL_VERIFICATION;
    expect(emailVerificationRequired()).toBe(true);
  });

  it("puede desactivarse en Preview personal", () => {
    process.env.DOLETH_REQUIRE_EMAIL_VERIFICATION = "false";
    process.env.VERCEL_ENV = "preview";
    expect(emailVerificationRequired()).toBe(false);
  });

  it("rechaza valores desconocidos", () => {
    process.env.DOLETH_REQUIRE_EMAIL_VERIFICATION = "quizas";
    expect(() => emailVerificationRequired()).toThrowError(ConfigurationError);
  });

  it("no permite desactivarla en Production", () => {
    process.env.DOLETH_REQUIRE_EMAIL_VERIFICATION = "false";
    process.env.VERCEL_ENV = "production";
    expect(() => emailVerificationRequired()).toThrowError(ConfigurationError);
  });
});

describe("modo de acceso", () => {
  it("habilita el registro público cuando la variable falta", () => {
    delete process.env.DOLETH_ACCESS_MODE;
    expect(accessMode()).toBe("public");
    expect(publicEmailAuthEnabled()).toBe(true);
  });

  it("habilita registro y correo sólo con public explícito", () => {
    process.env.DOLETH_ACCESS_MODE = "public";
    expect(accessMode()).toBe("public");
    expect(publicEmailAuthEnabled()).toBe(true);
  });

  it("cierra el registro sólo con beta privada explícita", () => {
    process.env.DOLETH_ACCESS_MODE = "private-beta";
    expect(accessMode()).toBe("private-beta");
    expect(publicEmailAuthEnabled()).toBe(false);
  });

  it("rechaza valores desconocidos", () => {
    process.env.DOLETH_ACCESS_MODE = "abierto";
    expect(() => accessMode()).toThrowError(ConfigurationError);
  });
});
