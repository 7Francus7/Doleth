"use client";

import { useId, useState } from "react";
import {
  amountErrorMessages,
  centsToCanonical,
  formatCentsAR,
  parseAmountInput,
} from "../../../lib/finance/amount";
import styles from "./AmountInput.module.css";

export interface AmountInputProps {
  /** Nombre del campo canónico que viaja al servidor, en formato que el dominio ya lee. */
  name: string;
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  hint?: string;
  /** Error del servidor. Tiene prioridad sobre la lectura local. */
  error?: string | undefined;
  autoFocus?: boolean;
  required?: boolean;
}

/**
 * Campo de importe en formato argentino.
 *
 * Mientras se escribe, el texto se respeta tal cual: no se reformatea, así que el
 * cursor nunca salta. Al salir del campo se acomoda a la lectura argentina.
 * Aparte del campo visible viaja un valor canónico en centavos exactos; el importe
 * nunca pasa por punto flotante.
 */
export function AmountInput({
  name,
  value,
  onValueChange,
  label = "Importe",
  hint,
  error,
  autoFocus,
  required,
}: AmountInputProps) {
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();
  const [touched, setTouched] = useState(false);

  const reading = parseAmountInput(value);
  const localError = touched && reading.error && reading.error !== "empty" ? amountErrorMessages[reading.error] : undefined;
  const shownError = error ?? localError;
  const canonical = reading.cents !== null && reading.error === null ? centsToCanonical(reading.cents) : "";

  const describedBy = [hint ? hintId : null, shownError ? errorId : null].filter(Boolean).join(" ");

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId}>{label}</label>
      <div className={styles.control}>
        <span aria-hidden="true" className={styles.currency}>$</span>
        <input
          aria-describedby={describedBy || undefined}
          aria-invalid={shownError ? true : undefined}
          autoComplete="off"
          autoFocus={autoFocus}
          className={styles.input}
          enterKeyHint="next"
          id={inputId}
          inputMode="decimal"
          onBlur={() => {
            setTouched(true);
            if (reading.cents !== null && reading.error === null) onValueChange(formatCentsAR(reading.cents));
          }}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder="0"
          required={required}
          value={value}
        />
      </div>
      {/* Valor exacto para el servidor: centavos, sin punto flotante. */}
      <input name={name} type="hidden" value={canonical} />
      {hint ? <p className={styles.hint} id={hintId}>{hint}</p> : null}
      {shownError ? <p className={styles.error} id={errorId} role="alert">{shownError}</p> : null}
    </div>
  );
}
