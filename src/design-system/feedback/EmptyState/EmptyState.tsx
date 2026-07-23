import type { ReactNode } from "react";
import styles from "./EmptyState.module.css";

export type EmptyStateVariant = "full" | "compact";

export interface EmptyStateProps {
  title: string;
  description?: string;
  variant?: EmptyStateVariant;
  /** Icono sobrio opcional (svg). No obligatorio. */
  icon?: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
}

/**
 * Estado vacío honesto: responde qué falta, por qué importa y qué puede hacer el
 * usuario. Sin ilustraciones decorativas obligatorias.
 */
export function EmptyState({
  title,
  description,
  variant = "full",
  icon,
  primaryAction,
  secondaryAction,
  className,
}: EmptyStateProps) {
  const classes = [styles.empty, styles[variant], className].filter(Boolean).join(" ");
  return (
    <section className={classes}>
      {icon ? <span aria-hidden="true" className={styles.icon}>{icon}</span> : null}
      <div className={styles.copy}>
        <h2 className={styles.title}>{title}</h2>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
      {primaryAction || secondaryAction ? (
        <div className={styles.actions}>
          {primaryAction}
          {secondaryAction}
        </div>
      ) : null}
    </section>
  );
}
