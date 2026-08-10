import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "../../components/auth/AuthShell";
import styles from "../../components/auth/auth.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cuenta eliminada · Doleth",
  robots: { index: false },
};

/**
 * Es pública a propósito: quien llega acá acaba de quedarse sin sesión, y una
 * pantalla privada lo mandaría al login sin decirle nunca que la baja salió bien.
 */
export default function AccountDeletedPage() {
  return (
    <AuthShell
      eyebrow="Listo"
      intro="Borramos tus cuentas, tus movimientos, tus inversiones y tus datos de acceso. No guardamos una copia."
      title="Tu cuenta fue eliminada"
    >
      <div className={styles.card}>
        <p className={styles.notice}>
          Gracias por haber usado Doleth. Si alguna vez querés volver, podés crear una cuenta nueva desde cero con
          el mismo correo.
        </p>
        <div className={styles.footerLinks}>
          <Link className={styles.link} href="/crear-cuenta">
            Crear una cuenta nueva
          </Link>
          <Link className={styles.link} href="/iniciar-sesion">
            Ir al inicio
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
