import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "../../../components/auth/AuthShell";
import styles from "../../../components/auth/auth.module.css";

export const metadata: Metadata = {
  title: "Contraseña actualizada · Doleth",
  robots: { index: false },
};

export default function PasswordResetDonePage() {
  return (
    <AuthShell
      eyebrow="Recuperar acceso"
      intro="Cerramos todas las sesiones que estaban abiertas, incluidas las de otros dispositivos."
      title="Contraseña actualizada"
    >
      <div className={styles.card}>
        <p className={styles.success} role="status">
          Ya podés entrar con tu contraseña nueva.
        </p>
        <Link className={styles.link} href="/iniciar-sesion">
          Iniciar sesión
        </Link>
      </div>
    </AuthShell>
  );
}
