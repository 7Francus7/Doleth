import { describe, expect, it } from "vitest";
import { isUsableSessionSecret, openSessionCookie, sealSessionCookie } from "./session-cookie";

const SECRET = "un-secreto-de-prueba-con-mas-de-32-caracteres";
const OTHER_SECRET = "otro-secreto-de-prueba-con-mas-de-32-caracteres";

describe("isUsableSessionSecret", () => {
  it("exige al menos 32 caracteres", () => {
    expect(isUsableSessionSecret(SECRET)).toBe(true);
    expect(isUsableSessionSecret("corto")).toBe(false);
    expect(isUsableSessionSecret(undefined)).toBe(false);
  });
});

describe("sealSessionCookie / openSessionCookie", () => {
  const future = new Date(Date.now() + 60_000);

  it("abre una cookie que acaba de sellar", async () => {
    const cookie = await sealSessionCookie("token-opaco", SECRET, future);
    const opened = await openSessionCookie(cookie, SECRET);
    expect(opened?.token).toBe("token-opaco");
  });

  it("no expone el token sin la firma correcta", async () => {
    const cookie = await sealSessionCookie("token-opaco", SECRET, future);
    expect(await openSessionCookie(cookie, OTHER_SECRET)).toBeNull();
  });

  it("rechaza una cookie con el token cambiado", async () => {
    const cookie = await sealSessionCookie("token-opaco", SECRET, future);
    const [version, , expires, signature] = cookie.split(".");
    const forjada = [version, "token-ajeno", expires, signature].join(".");
    expect(await openSessionCookie(forjada, SECRET)).toBeNull();
  });

  it("rechaza una cookie con el vencimiento estirado", async () => {
    const cookie = await sealSessionCookie("token-opaco", SECRET, future);
    const [version, token, expires, signature] = cookie.split(".");
    const estirada = [version, token, String(Number(expires) + 86_400), signature].join(".");
    expect(await openSessionCookie(estirada, SECRET)).toBeNull();
  });

  it("rechaza una cookie vencida aunque la firma sea válida", async () => {
    const cookie = await sealSessionCookie("token-opaco", SECRET, new Date(Date.now() + 1_000));
    expect(await openSessionCookie(cookie, SECRET, Date.now() + 5_000)).toBeNull();
  });

  it("rechaza cookies ausentes o con formato inesperado", async () => {
    for (const invalida of [undefined, "", "no-tiene-puntos", "v1.a.b", "v2.a.b.c", "v1...."]) {
      expect(await openSessionCookie(invalida, SECRET)).toBeNull();
    }
  });
});
