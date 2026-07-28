import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "../../components/auth/AuthShell";
import { ResendVerificationForm } from "../../components/auth/ResendVerificationForm";
import { VerifyEmailForm } from "../../components/auth/VerifyEmailForm";
import { TOKEN_FAILURE_MESSAGES, inspectToken } from "../../lib/auth/tokens";
import styles from "../../components/auth/auth.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confirmar correo · Doleth",
  robots: { index: false },
};

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const token = first((await searchParams).token);
  // Sólo se inspecciona: el token se consume al enviar el formulario.
  const lookup = await inspectToken(token, "EMAIL_VERIFICATION");

  if (!lookup.ok) {
    return (
      <AuthShell
        eyebrow="Confirmación"
        intro={TOKEN_FAILURE_MESSAGES[lookup.reason]}
        title="Este enlace no sirve"
      >
        <div className={styles.card}>
          <p className={styles.notice}>
            Pedí un enlace nuevo con la dirección que usaste al crear tu cuenta. El anterior queda invalidado.
          </p>
          <ResendVerificationForm />
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
      eyebrow="Confirmación"
      intro="Con esto activamos tu cuenta y te llevamos directo a la configuración inicial."
      title="Confirmá tu correo"
    >
      <div className={styles.card}>
        <VerifyEmailForm token={token ?? ""} />
      </div>
    </AuthShell>
  );
}
