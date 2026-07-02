"use client";

import * as Dialog from "@radix-ui/react-dialog";
import styles from "./SheetHeader.module.css";

export type SheetHeaderClose = "none" | "icon";

export interface SheetHeaderProps {
  title: string;
  subtitle?: string;
  close?: SheetHeaderClose;
  className?: string;
}

export function SheetHeader({
  title,
  subtitle,
  close = "icon",
  className,
}: SheetHeaderProps) {
  const classes = [styles.header, className].filter(Boolean).join(" ");

  return (
    <header className={classes}>
      <span aria-hidden="true" className={styles.handle} />
      <div className={styles.headerRow}>
        <div className={styles.copy}>
          <Dialog.Title className={styles.title}>{title}</Dialog.Title>
          {subtitle ? (
            <Dialog.Description className={styles.subtitle}>{subtitle}</Dialog.Description>
          ) : null}
        </div>
        {close === "icon" ? (
          <Dialog.Close aria-label="Cerrar" className={styles.closeButton}>
            <span aria-hidden="true" className={styles.closeIcon} />
          </Dialog.Close>
        ) : null}
      </div>
    </header>
  );
}
