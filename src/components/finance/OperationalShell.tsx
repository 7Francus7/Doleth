import type { ReactNode } from "react";
import Link from "next/link";
import { DolethBrand } from "../brand/DolethBrand";
import styles from "./finance.module.css";

export function OperationalShell({
  eyebrow,
  title,
  intro,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="app-canvas">
      <div className={`app-canvas__content ${styles.page}`}>
        <header className={styles.header}>
          <Link aria-label="Volver a Ahora" className={styles.back} href="/ahora"><DolethBrand compact /></Link>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 className={styles.title}>{title}</h1>
          {intro ? <p className={styles.intro}>{intro}</p> : null}
          {actions ? <div className={styles.headerActions}>{actions}</div> : null}
        </header>
        {children}
      </div>
    </main>
  );
}
