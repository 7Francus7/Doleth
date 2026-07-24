"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode, RefObject } from "react";
import styles from "./ConfirmDialog.module.css";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** Contenido propio de la decisión: resumen del movimiento, campos, etc. */
  children?: ReactNode;
  /** Acciones, cuando no viven dentro de un form propio en `children`. */
  footer?: ReactNode;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

/**
 * Confirmación de una decisión concreta.
 *
 * Radix aporta foco atrapado, Escape, backdrop, bloqueo de scroll y devolución
 * de foco; el motion reducido se respeta desde el CSS.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  returnFocusRef,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root modal onOpenChange={onOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} data-testid="confirm-dialog-backdrop" />
        <Dialog.Content
          className={styles.dialog}
          onCloseAutoFocus={(event) => {
            if (returnFocusRef?.current) {
              event.preventDefault();
              returnFocusRef.current.focus();
            }
          }}
        >
          <Dialog.Title className={styles.title}>{title}</Dialog.Title>
          <Dialog.Description className={styles.description}>{description}</Dialog.Description>
          {children ? <div className={styles.body}>{children}</div> : null}
          {footer ? <div className={styles.footer}>{footer}</div> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
