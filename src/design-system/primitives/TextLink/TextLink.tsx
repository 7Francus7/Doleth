"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes, ComponentPropsWithoutRef, MouseEvent } from "react";
import styles from "./TextLink.module.css";

export type TextLinkKind = "inline" | "standalone";

export interface TextLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  kind?: TextLinkKind;
  showChevron?: boolean;
  disabled?: boolean;
}

/**
 * Un destino interno de la app (`/cuentas`) es navegación del router: si se
 * resolviera con un `<a>` recargaría toda la aplicación y perdería el layout.
 * Un ancla dentro de la página (`#evidencia`) o un destino externo no: esos
 * siguen siendo un `<a>` común, porque `next/link` no aporta nada ahí.
 */
export function isInternalRoute(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

export function TextLink({
  href,
  kind = "inline",
  showChevron = false,
  disabled = false,
  className,
  children,
  onClick,
  tabIndex,
  ...props
}: TextLinkProps) {
  const classes = [styles.textLink, styles[`kind-${kind}`], className]
    .filter(Boolean)
    .join(" ");
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }

    onClick?.(event);
  };

  const content = (
    <>
      <span>{children}</span>
      {showChevron ? <span aria-hidden="true" className={styles.chevron} /> : null}
    </>
  );

  // Deshabilitado no navega: sin href no hay destino que el teclado pueda seguir.
  if (disabled || !isInternalRoute(href)) {
    return (
      <a
        {...props}
        aria-disabled={disabled || undefined}
        className={classes}
        href={disabled ? undefined : href}
        onClick={handleClick}
        tabIndex={disabled ? -1 : tabIndex}
      >
        {content}
      </a>
    );
  }

  // `Link` acepta los mismos atributos de ancla, pero los declara sin `undefined`
  // explícito; con `exactOptionalPropertyTypes` los dos tipos no son idénticos
  // aunque describan lo mismo. El cast se limita a esa diferencia.
  const anchorProps = props as Omit<ComponentPropsWithoutRef<typeof Link>, "href">;

  return (
    <Link
      {...anchorProps}
      className={classes}
      href={href}
      onClick={handleClick}
      {...(tabIndex !== undefined ? { tabIndex } : {})}
    >
      {content}
    </Link>
  );
}
