import type { ReactNode } from "react";
import styles from "./SuccessState.module.css";

export type SuccessStateVariant = "inline" | "full";

export interface SuccessStateProps {
  title: string;
  description?: string;
  /** Importe real de la operación, ya formateado (ej. "18.500"). */
  amount?: string;
  amountPrefix?: string;
  /** Cuenta afectada. */
  account?: string;
  variant?: SuccessStateVariant;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
}

/**
 * Confirmación de éxito que describe el resultado real. El importe y la cuenta se
 * pasan desde la respuesta de la acción; este componente no inventa valores.
 */
export function SuccessState({
  title,
  description,
  amount,
  amountPrefix = "$",
  account,
  variant = "full",
  primaryAction,
  secondaryAction,
  className,
}: SuccessStateProps) {
  const classes = [styles.success, styles[variant], className].filter(Boolean).join(" ");
  return (
    <section className={classes} role="status">
      <span aria-hidden="true" className={styles.mark}>
        <svg fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 2.5 2.5L16 9.5" />
        </svg>
      </span>
      <div className={styles.copy}>
        <h2 className={styles.title}>{title}</h2>
        {amount ? (
          <p className={styles.amount}>
            <span className={styles.amountPrefix}>{amountPrefix}</span>
            {amount}
            {account ? <span className={styles.account}> · {account}</span> : null}
          </p>
        ) : null}
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
