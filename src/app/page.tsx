import { redirect } from "next/navigation";
import { getOptionalUser } from "../lib/auth/guards";

export const dynamic = "force-dynamic";

/**
 * Puerta de entrada. Con sesión válida lleva al panel (o al onboarding si quedó a
 * medias); sin sesión, al login. La decisión se toma en el servidor.
 */
export default async function Home() {
  const user = await getOptionalUser();
  if (!user) redirect("/iniciar-sesion");
  redirect(user.onboardingCompletedAt ? "/ahora" : "/onboarding");
}
