import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "./lib/auth-token";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/ingresar") return NextResponse.next();
  const secret = process.env.DOLETH_SESSION_SECRET;
  const token = request.cookies.get("doleth_session")?.value;
  if (!secret || secret.length < 32 || !(await verifyAccessToken(token, secret))) {
    return NextResponse.redirect(new URL("/ingresar", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2)$).*)"],
};
