import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "../../components/auth/AuthShell";
import { ResetPasswordForm } from "../../components/auth/ResetPasswordForm";
import { TOKEN_FAILURE_MESSAGES, inspectToken } from "../../lib/auth/tokens";
import styles from "../../components/auth/auth.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Elegir contraseña nueva · Doleth",
  robots: { index: false },
};

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const token = first((await searchParams).token);
  const lookup = await inspectToken(token, "PASSWORD_RESET");

  if (!lookup.ok) {
    return (
      <AuthShell
        eyebrow="Recuperar acceso"
        intro={TOKEN_FAILURE_MESSAGES[lookup.reason]}
        title="Este enlace no sirve"
      >
        <div className={styles.card}>
          <p className={styles.notice}>
            Por seguridad los enlaces vencen en una hora y se usan una sola vez. Pedí uno nuevo para continuar.
          </p>
          <div className={styles.footerLinks}>
            <Link className={styles.link} href="/olvide-mi-contrasena">
              Pedir un enlace nuevo
            </Link>
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
      intro="Elegí una contraseña nueva. Cerramos las sesiones abiertas en otros dispositivos."
      title="Contraseña nueva"
    >
      <ResetPasswordForm token={token ?? ""} />
    </AuthShell>
  );
}
