"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreMenu } from "./MoreMenu";
import { NavIcon } from "./NavIcon";
import { isDestinationActive, primaryDestinations, registerAction } from "./navModel";
import styles from "./finance.module.css";

export function AppNav() {
  const pathname = usePathname();
  if (pathname === "/ingresar") return null;
  const [first, second, third] = primaryDestinations;
  const renderLink = (destination: (typeof primaryDestinations)[number]) => (
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
  );
  return (
    <nav aria-label="Navegación principal" className={styles.nav}>
      {renderLink(first)}
      {renderLink(second)}
      <Link aria-label={registerAction.label} className={styles.navAction} href={registerAction.href}>
        <span aria-hidden="true">+</span>
        <small>Registrar</small>
      </Link>
      {renderLink(third)}
      <MoreMenu />
    </nav>
  );
}
