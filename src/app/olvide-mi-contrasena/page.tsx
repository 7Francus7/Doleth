import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "../../components/auth/AuthShell";
import { ForgotPasswordForm } from "../../components/auth/ForgotPasswordForm";
import styles from "../../components/auth/auth.module.css";
import { publicEmailAuthEnabled } from "../../lib/auth/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recuperar contraseña · Doleth",
  description: "Pedí un enlace para elegir una contraseña nueva.",
};

export default function ForgotPasswordPage() {
  if (!publicEmailAuthEnabled()) {
    return (
      <AuthShell
        eyebrow="Beta privada"
        intro="La recuperación por correo todavía no está habilitada. Durante la beta, un administrador genera un enlace temporal y revoca tus sesiones anteriores."
        title="Recuperación administrada"
      >
        <div className={styles.card}>
          <p className={styles.notice}>Pedile un enlace temporal a la persona que administra tu invitación.</p>
          <div className={styles.footerLinks}>
            <Link className={styles.link} href="/iniciar-sesion">
              Volver a iniciar sesión
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

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
