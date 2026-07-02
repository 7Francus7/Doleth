import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

export type ButtonKind = "primary" | "secondary" | "ghost";
export type ButtonSize = "md" | "lg";
export type ButtonWidth = "hug" | "fill";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: ButtonKind;
  size?: ButtonSize;
  width?: ButtonWidth;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
}

export function Button({
  kind = "primary",
  size = "md",
  width = "hug",
  leadingIcon,
  trailingIcon,
  loading = false,
  loadingLabel = "Cargando",
  disabled,
  type = "button",
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = [
    styles.button,
    styles[`kind-${kind}`],
    styles[`size-${size}`],
    styles[`width-${width}`],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      aria-busy={loading || undefined}
      className={classes}
      data-state={loading ? "loading" : "default"}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {leadingIcon ? <span className={styles.icon}>{leadingIcon}</span> : null}
      <span>{loading ? loadingLabel : children}</span>
      {trailingIcon ? <span className={styles.icon}>{trailingIcon}</span> : null}
    </button>
  );
}
