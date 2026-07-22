"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./finance.module.css";

const items = [
  ["/ahora", "Ahora"],
  ["/movimientos", "Movimientos"],
  ["/proximo", "Próximo"],
  ["/cuentas", "Cuentas"],
] as const;

export function AppNav() {
  const pathname = usePathname();
  if (pathname === "/ingresar") return null;
  return (
    <nav aria-label="Navegación principal" className={styles.nav}>
      {items.map(([href, label]) => (
        <Link aria-current={pathname.startsWith(href) ? "page" : undefined} href={href} key={href}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
