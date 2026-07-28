import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "../../../components/auth/AuthShell";
import { ResendVerificationForm } from "../../../components/auth/ResendVerificationForm";
import { normalizeEmail } from "../../../lib/auth/validation";
import styles from "../../../components/auth/auth.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Revisá tu correo · Doleth",
  robots: { index: false },
};

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function CheckYourEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const email = normalizeEmail(first((await searchParams).email) ?? "");

  return (
    <AuthShell
      eyebrow="Falta un paso"
      intro={
        email
          ? `Si ${email} no tenía cuenta, ya te enviamos un enlace para confirmarla. Vence en 24 horas.`
          : "Te enviamos un enlace para confirmar tu correo. Vence en 24 horas."
      }
      title="Revisá tu correo"
    >
      <div className={styles.card}>
        <p className={styles.notice}>
          Buscá el mensaje de Doleth en tu bandeja de entrada. Si no aparece, revisá correo no deseado antes de pedir
          otro enlace.
        </p>
        <ResendVerificationForm defaultEmail={email} />
        <div className={styles.footerLinks}>
          <Link className={styles.link} href="/iniciar-sesion">
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
