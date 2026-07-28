import type { ReactNode } from "react";
import Link from "next/link";
import { DolethBrand } from "../brand/DolethBrand";
import styles from "./auth.module.css";

/**
 * Marco común de las pantallas públicas de identidad. Una sola columna, centrada,
 * pensada desde 320 px: pocas decisiones por pantalla y sin nada que simule datos
 * financieros antes de que la persona entre.
 */
export function AuthShell({
  eyebrow,
  title,
  intro,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className={styles.screen}>
      <div className={styles.frame}>
        <Link aria-label="Doleth · inicio" className={styles.brand} href="/">
          <DolethBrand compact />
        </Link>
        <header className={styles.header}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 className={styles.title}>{title}</h1>
          {intro ? <p className={styles.intro}>{intro}</p> : null}
        </header>
        {children}
        {footer ? <div className={styles.legal}>{footer}</div> : null}
      </div>
    </main>
  );
}
