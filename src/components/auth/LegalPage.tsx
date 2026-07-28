import type { ReactNode } from "react";
import Link from "next/link";
import { DolethBrand } from "../brand/DolethBrand";
import styles from "./legal.module.css";

export function LegalPage({
  eyebrow,
  title,
  updatedOn,
  children,
}: {
  eyebrow: string;
  title: string;
  updatedOn: string;
  children: ReactNode;
}) {
  return (
    <main className={styles.screen}>
      <article className={styles.frame}>
        <Link aria-label="Doleth · inicio" className={styles.brand} href="/">
          <DolethBrand compact />
        </Link>
        <header className={styles.header}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.updated}>Última actualización: {updatedOn}</p>
        </header>
        <div className={styles.prose}>{children}</div>
        <Link className={styles.back} href="/iniciar-sesion">
          Volver a Doleth
        </Link>
      </article>
    </main>
  );
}
