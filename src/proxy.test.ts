import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";
import { SESSION_COOKIE_NAME, sealSessionCookie } from "./lib/auth/session-cookie";

/**
 * El proxy sólo decide navegación. Estas pruebas fijan ese contrato y, sobre
 * todo, protegen contra la regresión que encontró el QA: cuando la cookie sigue
 * firmada pero la sesión ya fue revocada, sacar al usuario de las pantallas de
 * autenticación desde el edge genera un bucle infinito entre el login y la
 * pantalla privada. Esa decisión vive en las páginas, que sí consultan la base.
 */

const SECRET = "un-secreto-de-prueba-con-mas-de-32-caracteres";

function request(path: string, cookie?: string) {
  const url = `https://doleth.test${path}`;
  const headers = new Headers();
  if (cookie) headers.set("cookie", `${SESSION_COOKIE_NAME}=${cookie}`);
  return new NextRequest(url, { headers });
}

async function validCookie() {
  return sealSessionCookie("token-de-prueba", SECRET, new Date(Date.now() + 60_000));
}

describe("proxy", () => {
  process.env.DOLETH_SESSION_SECRET = SECRET;

  it("deja pasar las rutas públicas sin sesión", async () => {
    for (const path of ["/", "/iniciar-sesion", "/crear-cuenta", "/terminos", "/privacidad"]) {
      const response = await proxy(request(path));
      expect(response.status, path).toBe(200);
    }
  });

  it("manda al login las rutas privadas sin sesión, con el destino puesto", async () => {
    const response = await proxy(request("/movimientos?month=2026-07"));
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/iniciar-sesion");
    expect(location.searchParams.get("destino")).toBe("/movimientos?month=2026-07");
  });

  it("deja pasar las rutas privadas con una cookie firmada", async () => {
    const response = await proxy(request("/ahora", await validCookie()));
    expect(response.status).toBe(200);
  });

  it("rechaza una cookie con firma inválida", async () => {
    const response = await proxy(request("/ahora", "v1.token.9999999999.firma-falsa"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/iniciar-sesion");
  });

  it("no rebota al panel desde el login aunque haya cookie: eso causaría un bucle", async () => {
    const cookie = await validCookie();
    for (const path of ["/iniciar-sesion", "/crear-cuenta", "/olvide-mi-contrasena", "/ingresar"]) {
      const response = await proxy(request(path, cookie));
      expect(response.status, path).toBe(200);
      expect(response.headers.get("location"), path).toBeNull();
    }
  });

  it("agrega las cabeceras de seguridad en toda respuesta", async () => {
    for (const response of [
      await proxy(request("/iniciar-sesion")),
      await proxy(request("/movimientos")),
      await proxy(request("/ahora", await validCookie())),
    ]) {
      expect(response.headers.get("x-frame-options")).toBe("DENY");
      expect(response.headers.get("x-content-type-options")).toBe("nosniff");
      expect(response.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
      expect(response.headers.get("strict-transport-security")).toContain("max-age=");
    }
  });

  it("sin secreto configurado, todo lo privado queda cerrado", async () => {
    delete process.env.DOLETH_SESSION_SECRET;
    try {
      const response = await proxy(request("/ahora", await validCookie()));
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/iniciar-sesion");
    } finally {
      process.env.DOLETH_SESSION_SECRET = SECRET;
    }
  });
});
