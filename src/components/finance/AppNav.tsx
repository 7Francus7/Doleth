"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreMenu } from "./MoreMenu";
import { NewMovementMenu } from "./NewMovementMenu";
import { NavIcon } from "./NavIcon";
import { isDestinationActive, primaryDestinations, registerAction } from "./navModel";
import styles from "./finance.module.css";

const HIDDEN_ON = new Set([
  "/", "/ingresar", "/iniciar-sesion", "/crear-cuenta",
  "/crear-cuenta/revisa-tu-correo", "/invitacion", "/acceso-temporal",
  "/verificar-email", "/olvide-mi-contrasena", "/restablecer-contrasena",
  "/restablecer-contrasena/listo", "/terminos", "/privacidad", "/onboarding",
]);

export function AppNav() {
  const pathname = usePathname();
  if (HIDDEN_ON.has(pathname)) return null;

  return (
    <>
      <nav aria-label="Navegación principal" className={styles.nav}>
        {primaryDestinations.map((destination) => (
          <Link
            aria-current={isDestinationActive(destination.href, pathname) ? "page" : undefined}
            aria-label={destination.label}
            href={destination.href}
            key={destination.href}
          >
            <NavIcon name={destination.icon} />
            <span className={styles.navLabel}>{destination.label}</span>
            <span aria-hidden="true" className={styles.navLabelCompact}>{destination.compact}</span>
          </Link>
        ))}
      </nav>
      <div aria-label="Acciones globales" className={styles.navUtilities}>
        <NewMovementMenu actionHref={registerAction.href} />
        <MoreMenu />
      </div>
    </>
  );
}
