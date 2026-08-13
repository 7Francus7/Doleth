import type { HTMLAttributes, ReactNode } from "react";
import styles from "./PrioritySurface.module.css";

export type PrioritySurfaceTone =
  | "neutral"
  | "pressure"
  | "positive"
  | "investment"
  | "action";

export interface PrioritySurfaceProps extends HTMLAttributes<HTMLElement> {
  as?: "div" | "section" | "aside";
  children: ReactNode;
  tone?: PrioritySurfaceTone;
}

export function PrioritySurface({
  as: Element = "div",
  children,
  className,
  tone = "neutral",
  ...props
}: PrioritySurfaceProps) {
  const classes = [styles.surface, styles[`tone-${tone}`], className]
    .filter(Boolean)
    .join(" ");

  return (
    <Element className={classes} data-priority="primary" data-tone={tone} {...props}>
      {children}
    </Element>
  );
}
