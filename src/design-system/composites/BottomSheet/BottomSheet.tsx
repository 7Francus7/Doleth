"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode, RefObject } from "react";
import { SheetHeader } from "../../navigation/SheetHeader";
import styles from "./BottomSheet.module.css";

export type BottomSheetHeight = "auto" | "half" | "full";

export interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  height?: BottomSheetHeight;
  children: ReactNode;
  footer?: ReactNode;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

export function BottomSheet({
  open,
  onOpenChange,
  title,
  subtitle,
  height = "auto",
  children,
  footer,
  returnFocusRef,
}: BottomSheetProps) {
  return (
    <Dialog.Root modal onOpenChange={onOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} data-testid="bottom-sheet-backdrop" />
        <Dialog.Content
          {...(subtitle ? {} : { "aria-describedby": undefined })}
          className={`${styles.sheet} ${styles[`height-${height}`]}`}
          onCloseAutoFocus={(event) => {
            if (returnFocusRef?.current) {
              event.preventDefault();
              returnFocusRef.current.focus();
            }
          }}
        >
          <SheetHeader close="icon" {...(subtitle ? { subtitle } : {})} title={title} />
          <div className={styles.body}>{children}</div>
          {footer ? <div className={styles.footer}>{footer}</div> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
