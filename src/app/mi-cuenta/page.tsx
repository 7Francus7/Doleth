import { redirect } from "next/navigation";

/**
 * Nombre corto de la superficie de cuenta. La pantalla vive en
 * `/configuracion/cuenta` junto al resto de la configuración; esto existe porque
 * "mi cuenta" es lo que la gente escribe y busca, y una segunda copia de la
 * pantalla sería una que se desactualiza.
 *
 * No hace falta guardia: `/configuracion/cuenta` es privada y el proxy manda al
 * login a quien llegue sin sesión.
 */
export default function MyAccountPage() {
  redirect("/configuracion/cuenta");
}
