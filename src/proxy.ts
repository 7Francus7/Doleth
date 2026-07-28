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
]);

/**
 * Recursos del shell instalable. Son públicos y no llevan datos, pero necesitan
 * un `Cache-Control` propio: con el `no-store` de las pantallas privadas el
 * navegador no podría instalar la PWA, y con un cache largo una versión vieja
 * del service worker quedaría clavada. `/manifest.webmanifest` se resuelve acá y
 * por eso no figura en PUBLIC_PATHS.
 */
const PWA_ASSET_CACHE_CONTROL = new Map([
  ["/sw.js", "no-cache"],
  ["/manifest.webmanifest", "public, max-age=0, must-revalidate"],
  ["/offline.html", "public, max-age=0, must-revalidate"],
]);

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "connect-src 'self'",
  "font-src 'self' data:",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "img-src 'self' data: blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "worker-src 'self'",
].join("; ");

/**
 * Cabeceras de seguridad de toda respuesta. Donde los dos cortes discrepaban se
 * conservó la opción más estricta: `no-referrer` en lugar de
 * `strict-origin-when-cross-origin` —nada en la app necesita el referer, y una
 * URL de Doleth ya dice de qué habla— y el HSTS de dos años con `preload`.
 */
function protectedResponse(
  response: NextResponse,
  request: NextRequest,
  cacheControl = "private, no-store, max-age=0",
) {
  response.headers.set("Cache-Control", cacheControl);
  response.headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("Permissions-Policy", "camera=(), geolocation=(), microphone=(), payment=(), interest-cohort=()");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  if (request.nextUrl.protocol === "https:") {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const pwaCacheControl = PWA_ASSET_CACHE_CONTROL.get(pathname);
  if (pwaCacheControl) return protectedResponse(NextResponse.next(), request, pwaCacheControl);

  const secret = process.env.DOLETH_SESSION_SECRET;
  const hasCookie = isUsableSessionSecret(secret)
    ? (await openSessionCookie(request.cookies.get(SESSION_COOKIE_NAME)?.value, secret)) !== null
    : false;

  // Las rutas públicas pasan siempre. Sacar de las pantallas de autenticación a
  // quien ya entró es decisión de cada página, que puede consultar la base: si
  // se hiciera acá, con la cookie como única señal, una sesión revocada con
  // cookie todavía firmada entraría en un bucle infinito de redirecciones entre
  // el login y la pantalla privada.
  if (PUBLIC_PATHS.has(pathname)) return protectedResponse(NextResponse.next(), request);

  if (!hasCookie) {
    const login = new URL("/iniciar-sesion", request.url);
    // El destino se vuelve a validar en el servidor antes de usarse.
    login.searchParams.set("destino", `${pathname}${search}`);
    const response = NextResponse.redirect(login);
    // Si venía una cookie inservible, se limpia para no arrastrar el estado.
    if (request.cookies.has(SESSION_COOKIE_NAME)) response.cookies.delete(SESSION_COOKIE_NAME);
    return protectedResponse(response, request);
  }

  return protectedResponse(NextResponse.next(), request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2)$).*)"],
};
