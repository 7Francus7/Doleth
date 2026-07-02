"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";
import styles from "./TextLink.module.css";

export type TextLinkKind = "inline" | "standalone";

export interface TextLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  kind?: TextLinkKind;
  showChevron?: boolean;
  disabled?: boolean;
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

  return (
    <a
      {...props}
      aria-disabled={disabled || undefined}
      className={classes}
      href={disabled ? undefined : href}
      onClick={handleClick}
      tabIndex={disabled ? -1 : tabIndex}
    >
      <span>{children}</span>
      {showChevron ? <span aria-hidden="true" className={styles.chevron} /> : null}
    </a>
  );
}
