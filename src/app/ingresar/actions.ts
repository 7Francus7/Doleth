"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAccessToken, secureTextEqual } from "../../lib/auth-token";

export async function loginAction(formData: FormData): Promise<void> {
  const supplied = String(formData.get("password") ?? "");
  const configured = process.env.DOLETH_ACCESS_PASSWORD;
  const secret = process.env.DOLETH_SESSION_SECRET;
  if (!configured || configured.length < 12 || !secret || secret.length < 32) redirect("/ingresar?error=config");
  if (!(await secureTextEqual(supplied, configured))) redirect("/ingresar?error=invalid");
  const store = await cookies();
  store.set("doleth_session", await createAccessToken(secret), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/ahora");
}
