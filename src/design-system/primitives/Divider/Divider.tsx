import type { ComponentPropsWithoutRef } from "react";
import styles from "./Divider.module.css";

export type DividerInset = "none" | "md" | "lg";
export type DividerTone = "subtle" | "default";

export interface DividerProps extends ComponentPropsWithoutRef<"hr"> {
  inset?: DividerInset;
  tone?: DividerTone;
}

export function Divider({
  inset = "none",
  tone = "subtle",
  className,
  ...props
}: DividerProps) {
  const classes = [styles.divider, styles[`inset-${inset}`], styles[`tone-${tone}`], className]
    .filter(Boolean)
    .join(" ");

  return <hr className={classes} {...props} />;
}
