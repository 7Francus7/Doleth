"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { BottomSheet } from "../../design-system/composites/BottomSheet";
import styles from "./finance.module.css";

export function NewMovementMenu({ actionHref }: { actionHref: string }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const actions = [
    { href: `${actionHref}?tipo=EXPENSE`, label: "Gasto", code: "−" },
    { href: `${actionHref}?tipo=INCOME`, label: "Ingreso", code: "+" },
    { href: `${actionHref}?tipo=TRANSFER`, label: "Transferencia", code: "→" },
    { href: "/inversiones/nueva", label: "Inversión", code: "↗" },
  ] as const;

  return (
    <>
      <button aria-expanded={open} aria-haspopup="dialog" className={styles.newTrigger}
        onClick={() => setOpen(true)} ref={triggerRef} type="button">
        <span aria-hidden="true">+</span> Nuevo
      </button>
      <BottomSheet onOpenChange={setOpen} open={open} returnFocusRef={triggerRef}
        subtitle="Elegí la operación. El registro existente conserva las reglas." title="Nuevo">
        <nav aria-label="Crear registro" className={styles.newMenu}>
          {actions.map((action) => (
            <Link href={action.href} key={action.href} onClick={() => setOpen(false)}>
              <span aria-hidden="true">{action.code}</span>{action.label}
            </Link>
          ))}
        </nav>
      </BottomSheet>
    </>
  );
}
