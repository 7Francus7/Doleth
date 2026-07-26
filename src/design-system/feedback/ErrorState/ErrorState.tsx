import type { ReactNode } from "react";
import styles from "./ErrorState.module.css";

export type ErrorStateVariant = "screen" | "section" | "inline";

export interface ErrorStateProps {
  title: string;
  description: string;
  /** Frase que aclara que los datos guardados siguen seguros. */
  safetyLine?: string;
  variant?: ErrorStateVariant;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  /** Marca el bloque como alerta para lectores de pantalla. Usar solo si es urgente. */
  assertive?: boolean;
  className?: string;
}

/**
 * Estado de error sobrio: nunca muestra trazas ni mensajes técnicos. Explica qué
 * pasó, qué sigue seguro y qué puede hacer el usuario.
 */
export function ErrorState({
  title,
  description,
  safetyLine,
  variant = "section",
  primaryAction,
  secondaryAction,
  assertive = false,
  className,
}: ErrorStateProps) {
  const classes = [styles.error, styles[variant], className].filter(Boolean).join(" ");
  const Heading = variant === "screen" ? "h1" : "h2";
  return (
    <section className={classes} {...(assertive ? { role: "alert" } : {})}>
      <span aria-hidden="true" className={styles.mark}>
        <svg fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4.5" />
          <path d="M12 15.5h.01" />
        </svg>
      </span>
      <div className={styles.copy}>
        <Heading className={styles.title}>{title}</Heading>
        <p className={styles.description}>{description}</p>
        {safetyLine ? <p className={styles.safety}>{safetyLine}</p> : null}
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
