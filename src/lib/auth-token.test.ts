import { describe, expect, it } from "vitest";
import { createAccessToken, secureTextEqual, verifyAccessToken } from "./auth-token";

describe("sesión single-user", () => {
  it("acepta token firmado y rechaza token manipulado", async () => {
    const secret = "s".repeat(32);
    const token = await createAccessToken(secret);
    expect(await verifyAccessToken(token, secret)).toBe(true);
    expect(await verifyAccessToken(`${token}x`, secret)).toBe(false);
  });

  it("compara la clave sin depender de su longitud", async () => {
    expect(await secureTextEqual("clave correcta", "clave correcta")).toBe(true);
    expect(await secureTextEqual("clave incorrecta", "clave correcta")).toBe(false);
  });
});
