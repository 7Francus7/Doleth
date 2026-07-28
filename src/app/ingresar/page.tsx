import { redirect } from "next/navigation";

/**
 * Ruta histórica de la etapa de un solo usuario. Se mantiene como redirección
 * para que los accesos directos guardados en pantallas de inicio sigan andando.
 */
export default function LegacyLoginPage() {
  redirect("/iniciar-sesion");
}
