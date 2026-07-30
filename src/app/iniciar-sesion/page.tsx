import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "../../components/auth/AuthShell";
import { LoginForm } from "../../components/auth/LoginForm";
import { accessMode } from "../../lib/auth/config";
import { getOptionalUser } from "../../lib/auth/guards";
import { safeInternalPath } from "../../lib/auth/redirect";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Iniciar sesión · Doleth",
  description: "Entrá a tu espacio financiero en Doleth.",
};

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  // Se sanea acá y otra vez en la acción: un destino externo nunca sobrevive.
  const destination = safeInternalPath(first(query.destino));

  const user = await getOptionalUser();
  if (user) redirect(user.onboardingCompletedAt ? destination : "/onboarding");

  return (
    <AuthShell
      eyebrow="Acceso"
      intro="Tus cuentas, movimientos y compromisos siguen donde los dejaste."
      title="Entrar a Doleth"
    >
      <LoginForm destination={destination} privateBeta={accessMode() === "private-beta"} />
    </AuthShell>
  );
}
