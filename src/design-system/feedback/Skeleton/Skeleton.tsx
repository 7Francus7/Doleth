import type { CSSProperties } from "react";
import styles from "./Skeleton.module.css";

export type SkeletonVariant = "line" | "block" | "circle" | "value" | "card" | "row";

export interface SkeletonProps {
  variant?: SkeletonVariant;
  /** Ancho explícito (ej. "60%", "8rem"). Por defecto depende de la variante. */
  width?: string;
  /** Alto explícito. Por defecto depende de la variante. */
  height?: string;
  /** Cantidad de líneas para la variante "line" (última más corta). */
  lines?: number;
  className?: string;
}

/**
 * Placeholder de carga puramente visual. Nunca contiene texto ni valores reales:
 * está oculto a lectores de pantalla (aria-hidden) y no es enfocable. El shimmer
 * se desactiva con prefers-reduced-motion.
 */
export function Skeleton({ variant = "line", width, height, lines = 1, className }: SkeletonProps) {
  const classes = [styles.skeleton, styles[variant], className].filter(Boolean).join(" ");

  if (variant === "line" && lines > 1) {
    return (
      <span aria-hidden="true" className={styles.lines}>
        {Array.from({ length: lines }, (_, index) => (
          <span
            className={classes}
            key={index}
            style={{
              width: index === lines - 1 ? "62%" : (width ?? "100%"),
              ...(height ? { height } : {}),
            }}
          />
        ))}
      </span>
    );
  }

  const style: CSSProperties = {
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  };

  return <span aria-hidden="true" className={classes} style={style} />;
}
