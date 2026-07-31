/**
 * Validación de destinos de retorno, para que `?destino=` no se convierta en un
 * open redirect.
 *
 * Regla: sólo rutas internas absolutas (`/algo`). Se rechaza cualquier cosa que
 * pueda resolverse fuera del sitio, incluidas las formas `//host`, `/\host`,
 * `https://…`, `javascript:` y rutas con caracteres de control.
 */

const DEFAULT_DESTINATION = "/ahora";

/** Rutas públicas de autenticación: volver a ellas después de entrar no tiene sentido. */
const NON_RETURNABLE = new Set([
  "/iniciar-sesion",
  "/crear-cuenta",
  "/ingresar",
  "/verificar-email",
  "/olvide-mi-contrasena",
  "/restablecer-contrasena",
]);

export function safeInternalPath(raw: string | undefined | null, fallback = DEFAULT_DESTINATION): string {
  if (!raw) return fallback;
  const candidate = raw.trim();

  if (!candidate.startsWith("/")) return fallback;
  if (candidate.startsWith("//") || candidate.startsWith("/\\")) return fallback;
  // Caracteres de control: exactamente lo que hay que rechazar en una ruta.
  if (/[\u0000-\u001f\u007f]/.test(candidate)) return fallback;
  if (candidate.includes("\\")) return fallback;

  let parsed: URL;
  try {
    parsed = new URL(candidate, "https://doleth.invalid");
  } catch {
    return fallback;
  }
  if (parsed.origin !== "https://doleth.invalid") return fallback;
  if (NON_RETURNABLE.has(parsed.pathname)) return fallback;

  return `${parsed.pathname}${parsed.search}`;
}

export { DEFAULT_DESTINATION };
