import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "./lib/auth-token";

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

function protectedResponse(
  response: NextResponse,
  request: NextRequest,
  cacheControl = "private, no-store, max-age=0",
) {
  response.headers.set("Cache-Control", cacheControl);
  response.headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("Permissions-Policy", "camera=(), geolocation=(), microphone=(), payment=()");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  if (request.nextUrl.protocol === "https:") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname === "/sw.js") {
    return protectedResponse(NextResponse.next(), request, "no-cache");
  }
  if (["/manifest.webmanifest", "/offline.html"].includes(pathname)) {
    return protectedResponse(
      NextResponse.next(),
      request,
      "public, max-age=0, must-revalidate",
    );
  }
  if (pathname === "/ingresar") {
    return protectedResponse(NextResponse.next(), request);
  }
  const secret = process.env.DOLETH_SESSION_SECRET;
  const token = request.cookies.get("doleth_session")?.value;
  if (!secret || secret.length < 32 || !(await verifyAccessToken(token, secret))) {
    return protectedResponse(
      NextResponse.redirect(new URL("/ingresar", request.url)),
      request,
    );
  }
  return protectedResponse(NextResponse.next(), request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2)$).*)"],
};
