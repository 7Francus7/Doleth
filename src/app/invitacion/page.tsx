import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "../../components/auth/AuthShell";
import { PrivateBetaInviteForm } from "../../components/auth/PrivateBetaInviteForm";
import { getOptionalUser } from "../../lib/auth/guards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Invitación privada · Doleth",
  description: "Activá tu acceso personal a la beta privada de Doleth.",
  robots: { index: false },
};

export default async function InvitationPage() {
  const user = await getOptionalUser();
  if (user) redirect(user.onboardingCompletedAt ? "/ahora" : "/onboarding");

  return (
    <AuthShell
      eyebrow="Beta privada"
      intro="Esta invitación es personal, vence y se usa una sola vez. El correo queda asociado al acceso, pero todavía no se verifica por email."
      title="Activar tu invitación"
    >
      <PrivateBetaInviteForm />
    </AuthShell>
  );
}
