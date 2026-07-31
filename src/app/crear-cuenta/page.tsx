import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "../../components/auth/AuthShell";
import { RegisterForm } from "../../components/auth/RegisterForm";
import { publicEmailAuthEnabled } from "../../lib/auth/config";
import { getOptionalUser } from "../../lib/auth/guards";
import styles from "../../components/auth/auth.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Crear cuenta · Doleth",
  description: "Creá tu cuenta para entender cuánto tenés, qué cambió y qué viene después.",
};

export default async function CreateAccountPage() {
  // Quien ya entró no tiene nada que hacer en una pantalla de registro.
  const user = await getOptionalUser();
  if (user) redirect(user.onboardingCompletedAt ? "/ahora" : "/onboarding");

  if (!publicEmailAuthEnabled()) {
    return (
      <AuthShell
        eyebrow="Beta privada"
        intro="El registro público está cerrado. El acceso se habilita únicamente con una invitación personal compartida por un administrador."
        title="Doleth está en beta privada"
      >
        <div className={styles.card}>
          <p className={styles.notice}>
            Las invitaciones vencen, se usan una sola vez y quedan vinculadas al correo invitado.
          </p>
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
      eyebrow="Empezar"
      intro="Doleth te ayuda a entender cuánto tenés, qué cambió y qué viene después. Tus datos son sólo tuyos."
      title="Crear tu cuenta"
      footer={
        <>
          Al crear la cuenta aceptás los{" "}
          <Link className={styles.link} href="/terminos">
            términos
          </Link>{" "}
          y la{" "}
          <Link className={styles.link} href="/privacidad">
            política de privacidad
          </Link>
          .
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
