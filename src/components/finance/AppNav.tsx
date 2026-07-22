"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./finance.module.css";

const items = [
  ["/ahora", "Ahora", "Ahora", "home"],
  ["/movimientos", "Movimientos", "Movs.", "activity"],
  ["/proximo", "Próximo", "Pagos", "calendar"],
  ["/cuentas", "Cuentas", "Cuentas", "wallet"],
] as const;

function NavIcon({ name }: { name: (typeof items)[number][3] }) {
  const paths = {
    home: <><path d="m4 10 8-6 8 6v9H4z" /><path d="M9 19v-6h6v6" /></>,
    activity: <><path d="M4 18V9M10 18V5M16 18v-7M22 18V7" /><path d="M3 18h19" /></>,
    calendar: <><rect height="16" rx="2" width="18" x="3" y="5" /><path d="M7 3v4M17 3v4M3 10h18" /></>,
    wallet: <><path d="M4 7h15a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h13" /><path d="M16 12h5v4h-5a2 2 0 0 1 0-4Z" /></>,
  };
  return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">{paths[name]}</svg>;
}

export function AppNav() {
  const pathname = usePathname();
  if (pathname === "/ingresar") return null;
  return (
    <nav aria-label="Navegación principal" className={styles.nav}>
      {items.slice(0, 2).map(([href, label, compactLabel, icon]) => (
        <Link aria-current={pathname.startsWith(href) ? "page" : undefined} aria-label={label} href={href} key={href}>
          <NavIcon name={icon} />
          <span className={styles.navLabel}>{label}</span>
          <span aria-hidden="true" className={styles.navLabelCompact}>{compactLabel}</span>
        </Link>
      ))}
      <Link aria-label="Registrar movimiento" className={styles.navAction} href="/movimientos/nuevo">
        <span aria-hidden="true">+</span>
        <small>Registrar</small>
      </Link>
      {items.slice(2).map(([href, label, compactLabel, icon]) => (
        <Link aria-current={pathname.startsWith(href) ? "page" : undefined} aria-label={label} href={href} key={href}>
          <NavIcon name={icon} />
          <span className={styles.navLabel}>{label}</span>
          <span aria-hidden="true" className={styles.navLabelCompact}>{compactLabel}</span>
        </Link>
      ))}
    </nav>
  );
}
