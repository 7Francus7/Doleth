import type { ReactNode } from "react";
import styles from "./StatusMessage.module.css";

export type StatusTone = "success" | "error" | "info" | "warning";

export interface StatusMessageProps {
  tone: StatusTone;
  children: ReactNode;
  /** Acción opcional (ej. un enlace o botón). */
  action?: ReactNode;
  className?: string;
}

// Icono por tono: la forma (no solo el color) distingue el estado, para no
// depender del color como único canal de información.
const glyph: Record<StatusTone, ReactNode> = {
  success: <path d="m4 8.5 2.5 2.5L12 5" />,
  error: <><path d="M8 4v5" /><path d="M8 11.5h.01" /></>,
  info: <><path d="M8 7v4.5" /><path d="M8 4.5h.01" /></>,
  warning: <><path d="M8 3 2.5 13h11z" /><path d="M8 7v3" /><path d="M8 11.5h.01" /></>,
};

const roleFor: Record<StatusTone, "status" | "alert"> = {
  success: "status",
  error: "alert",
  info: "status",
  warning: "status",
};

/**
 * Mensaje breve de estado del sistema con role adecuado (alert solo para error)
 * e icono que no depende del color. Layout estable.
 */
export function StatusMessage({ tone, children, action, className }: StatusMessageProps) {
  const classes = [styles.message, styles[tone], className].filter(Boolean).join(" ");
  return (
    <p className={classes} role={roleFor[tone]}>
      <svg aria-hidden="true" className={styles.icon} fill="none" viewBox="0 0 16 16">
        {glyph[tone]}
      </svg>
      <span className={styles.copy}>{children}</span>
      {action ? <span className={styles.action}>{action}</span> : null}
    </p>
  );
}
