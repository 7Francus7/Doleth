import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, isUsableSessionSecret, openSessionCookie } from "./lib/auth/session-cookie";

/**
 * Primera línea de defensa: navegación.
 *
 * Corre en el edge, así que sólo puede verificar la firma y el vencimiento de la
 * cookie —no tiene acceso a la base—. Sirve para redirigir a tiempo y evitar que
 * una pantalla privada empiece a renderizarse, pero NO es la autorización.
 *
 * La autorización real vive en `requireUser()` / `requireOnboardedUserForAction()`,
 * que consultan la tabla `Session` y filtran cada consulta por propietario. Una
 * cookie con firma válida pero sesión revocada pasa por acá y muere allá.
 */

/** Rutas accesibles sin sesión. Todo lo demás es privado por omisión. */
const PUBLIC_PATHS = new Set([
  "/",
  "/ingresar",
  "/iniciar-sesion",
  "/crear-cuenta",
  "/crear-cuenta/revisa-tu-correo",
  "/verificar-email",
  "/olvide-mi-contrasena",
  "/restablecer-contrasena",
  "/restablecer-contrasena/listo",
  "/terminos",
  "/privacidad",
  "/manifest.webmanifest",
]);

const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-DNS-Prefetch-Control": "off",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

function withSecurityHeaders(response: NextResponse): NextResponse {
  for (const [header, value] of Object.entries(SECURITY_HEADERS)) response.headers.set(header, value);
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const secret = process.env.DOLETH_SESSION_SECRET;
  const hasCookie = isUsableSessionSecret(secret)
    ? (await openSessionCookie(request.cookies.get(SESSION_COOKIE_NAME)?.value, secret)) !== null
    : false;

  // Las rutas públicas pasan siempre. Sacar de las pantallas de autenticación a
  // quien ya entró es decisión de cada página, que puede consultar la base: si
  // se hiciera acá, con la cookie como única señal, una sesión revocada con
  // cookie todavía firmada entraría en un bucle infinito de redirecciones entre
  // el login y la pantalla privada.
  if (PUBLIC_PATHS.has(pathname)) return withSecurityHeaders(NextResponse.next());

  if (!hasCookie) {
    const login = new URL("/iniciar-sesion", request.url);
    // El destino se vuelve a validar en el servidor antes de usarse.
    login.searchParams.set("destino", `${pathname}${search}`);
    const response = NextResponse.redirect(login);
    // Si venía una cookie inservible, se limpia para no arrastrar el estado.
    if (request.cookies.has(SESSION_COOKIE_NAME)) response.cookies.delete(SESSION_COOKIE_NAME);
    return withSecurityHeaders(response);
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2)$).*)"],
};
