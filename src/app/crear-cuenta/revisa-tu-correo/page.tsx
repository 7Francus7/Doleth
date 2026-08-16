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
  const query = await searchParams;
  const email = normalizeEmail(first(query.email) ?? "");
  // El registro guardó la cuenta y el correo no salió. Decirlo cambia lo que esa
  // persona hace después: sin el aviso reintenta el alta —y choca con el tope por
  // destinatario— en vez de pedir que la habiliten.
  const deliveryFailed = first(query.envio) === "fallido";

  return (
    <AuthShell
      eyebrow={deliveryFailed ? "Tu cuenta quedó creada" : "Falta un paso"}
      intro={
        deliveryFailed
          ? "No pudimos enviarte el correo de confirmación. Tu cuenta ya existe: falta habilitarla."
          : email
            ? `Si ${email} no tenía cuenta, ya te enviamos un enlace para confirmarla. Vence en 24 horas.`
            : "Te enviamos un enlace para confirmar tu correo. Vence en 24 horas."
      }
      title={deliveryFailed ? "El correo no salió" : "Revisá tu correo"}
    >
      <div className={styles.card}>
        <p className={styles.notice}>
          {deliveryFailed
            ? "No hace falta que vuelvas a registrarte: repetir el alta no crea otra cuenta y sí consume los intentos. Pedile a quien administra Doleth que te habilite, o probá el enlace de nuevo más tarde."
            : "Buscá el mensaje de Doleth en tu bandeja de entrada. Si no aparece, revisá correo no deseado antes de pedir otro enlace."}
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
