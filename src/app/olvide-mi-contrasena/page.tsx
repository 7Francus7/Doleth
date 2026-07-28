import type { Metadata } from "next";
import { AuthShell } from "../../components/auth/AuthShell";
import { ForgotPasswordForm } from "../../components/auth/ForgotPasswordForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recuperar contraseña · Doleth",
  description: "Pedí un enlace para elegir una contraseña nueva.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Recuperar acceso"
      intro="Escribí tu correo y te mandamos un enlace para elegir una contraseña nueva."
      title="Olvidé mi contraseña"
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
