import type { ComponentPropsWithoutRef } from "react";
import styles from "./Label.module.css";

export type LabelSize = "s" | "m" | "l";
export type LabelTone = "primary" | "secondary" | "tertiary";
export type LabelCase = "sentence" | "uppercase";
export type LabelElement = "span" | "label" | "p";

export interface LabelProps extends ComponentPropsWithoutRef<"span"> {
  as?: LabelElement;
  size?: LabelSize;
  tone?: LabelTone;
  textCase?: LabelCase;
  htmlFor?: string;
}

export function Label({
  as = "span",
  size = "m",
  tone = "secondary",
  textCase = "sentence",
  htmlFor,
  className,
  ...props
}: LabelProps) {
  const classes = [
    styles.label,
    styles[`size-${size}`],
    styles[`tone-${tone}`],
    styles[`case-${textCase}`],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (as === "label") {
    return <label className={classes} htmlFor={htmlFor} {...props} />;
  }

  if (as === "p") {
    return <p className={classes} {...props} />;
  }

  return <span className={classes} {...props} />;
}
