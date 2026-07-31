"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "../../design-system/primitives/Button";
import { assessPassword } from "../../lib/auth/validation";
import styles from "./auth.module.css";

type BaseInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className">;

export function TextField({
  label,
  error,
  hint,
  ...input
}: BaseInputProps & { label: string; error?: string | undefined; hint?: ReactNode }) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ");

  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <input
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : undefined}
        id={id}
        {...input}
      />
      {hint ? (
        <span className={styles.hint} id={hintId}>
          {hint}
        </span>
      ) : null}
      {error ? (
        <span className={styles.fieldError} id={errorId}>
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function PasswordField({
  label,
  error,
  hint,
  showStrength = false,
  ...input
}: BaseInputProps & {
  label: string;
  error?: string | undefined;
  hint?: ReactNode;
  showStrength?: boolean;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const meterId = `${id}-meter`;
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");
  const assessment = assessPassword(value);
  const describedBy = [error ? errorId : null, hint ? hintId : null, showStrength ? meterId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <div className={styles.passwordWrap}>
        <input
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? true : undefined}
          id={id}
          type={visible ? "text" : "password"}
          {...input}
          onChange={(event) => {
            if (showStrength) setValue(event.target.value);
            input.onChange?.(event);
          }}
        />
        <button
          aria-pressed={visible}
          className={styles.reveal}
          onClick={() => setVisible((current) => !current)}
          type="button"
        >
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      </div>
      {showStrength ? (
        <div className={styles.meter} id={meterId}>
          <div aria-hidden="true" className={styles.meterTrack}>
            {[1, 2, 3].map((segment) => (
              <span
                className={styles.meterSegment}
                data-filled={assessment.score >= segment}
                data-tone={assessment.strength}
                key={segment}
              />
            ))}
          </div>
          <span aria-live="polite" className={styles.meterLabel}>
            {value ? `Seguridad: ${assessment.label}` : "Cuanto más larga, mejor. Mínimo 10 caracteres."}
          </span>
        </div>
      ) : null}
      {hint ? (
        <span className={styles.hint} id={hintId}>
          {hint}
        </span>
      ) : null}
      {error ? (
        <span className={styles.fieldError} id={errorId}>
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function CheckboxField({
  label,
  error,
  ...input
}: BaseInputProps & { label: ReactNode; error?: string | undefined }) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={styles.field}>
      <div className={styles.checkboxField}>
        <input
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? true : undefined}
          id={id}
          type="checkbox"
          {...input}
        />
        <label htmlFor={id}>{label}</label>
      </div>
      {error ? (
        <span className={styles.fieldError} id={errorId}>
          {error}
        </span>
      ) : null}
    </div>
  );
}

/**
 * `useFormStatus` deshabilita el botón mientras la acción está en vuelo, que es
 * la protección real contra el doble submit: el navegador no puede reenviar el
 * formulario porque el control está inhabilitado.
 */
export function AuthSubmit({
  children,
  pendingLabel = "Un momento…",
  kind = "primary",
}: {
  children: string;
  pendingLabel?: string;
  kind?: "primary" | "secondary" | "ghost";
}) {
  const { pending } = useFormStatus();
  return (
    <Button kind={kind} loading={pending} loadingLabel={pendingLabel} size="lg" type="submit" width="fill">
      {children}
    </Button>
  );
}
