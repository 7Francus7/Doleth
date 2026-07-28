import Link from "next/link";
import { getOptionalUser } from "../../lib/auth/guards";
import styles from "./account-link.module.css";

/**
 * Acceso discreto a la configuración de la cuenta.
 *
 * Vive en el layout para no tocar las superficies congeladas de Doleth ni la
 * barra inferior de navegación. Sin sesión no renderiza nada.
 */
export async function AccountLink() {
  const user = await getOptionalUser();
  if (!user || !user.onboardingCompletedAt) return null;

  const initial = user.name.trim().charAt(0).toUpperCase() || "·";

  return (
    <Link aria-label={`Tu cuenta · ${user.name}`} className={styles.link} href="/configuracion/cuenta">
      <span aria-hidden="true" className={styles.avatar}>
        {initial}
      </span>
    </Link>
  );
}
