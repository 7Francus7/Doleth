"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { BottomSheet } from "../../design-system/composites/BottomSheet";
import { logoutAction } from "../../app/actions/session";
import { NavIcon } from "./NavIcon";
import { isDestinationActive, isMoreActive, moreGroups } from "./navModel";
import styles from "./finance.module.css";

export function MoreMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const active = isMoreActive(pathname);

  return (
    <>
      <button
        aria-controls="more-panel"
        aria-current={active ? "page" : undefined}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Más superficies"
        className={styles.navMore}
        data-active={active || undefined}
        onClick={() => setOpen(true)}
        ref={triggerRef}
        type="button"
      >
        <NavIcon name="more" />
        <span className={styles.navLabel}>Más</span>
        <span aria-hidden="true" className={styles.navLabelCompact}>Más</span>
      </button>
      <BottomSheet
        onOpenChange={setOpen}
        open={open}
        returnFocusRef={triggerRef}
        subtitle="Recorré el resto de Doleth."
        title="Más"
      >
        <nav aria-label="Más superficies" className={styles.moreNav} id="more-panel">
          {moreGroups.map((group) => (
            <section className={styles.moreGroup} key={group.title}>
              <p className={styles.moreGroupTitle}>{group.title}</p>
              <ul className={styles.moreList}>
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      aria-current={isDestinationActive(item.href, pathname) ? "page" : undefined}
                      className={styles.moreItem}
                      href={item.href}
                      onClick={() => setOpen(false)}
                    >
                      <span aria-hidden="true" className={styles.moreItemIcon}><NavIcon name={item.icon} /></span>
                      <span className={styles.moreItemCopy}>
                        <span className={styles.moreItemLabel}>{item.label}</span>
                        {item.hint ? <span className={styles.moreItemHint}>{item.hint}</span> : null}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <form action={logoutAction} className={styles.moreSession}>
            <button className={styles.moreLogout} type="submit">Cerrar sesión</button>
          </form>
        </nav>
      </BottomSheet>
    </>
  );
}
