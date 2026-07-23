"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "./actions";
import { Button } from "../../design-system/primitives/Button";
import styles from "../../components/finance/finance.module.css";

function LoginSubmit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={disabled} loading={pending} loadingLabel="Verificando…" size="lg" type="submit" width="fill">
      Entrar
    </Button>
  );
}

export function LoginForm({ error }: { error?: string }) {
  const [value, setValue] = useState("");
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const helpId = useId();
  const errorId = useId();

  // Al llegar con error, devolvemos el foco al campo para corregir sin buscar.
  useEffect(() => {
    if (error) inputRef.current?.focus();
  }, [error]);

  const describedBy = `${helpId}${error ? ` ${errorId}` : ""}`;

  return (
    <form action={loginAction} className={styles.loginForm}>
      <div className={styles.field}>
        <label htmlFor="password">Clave personal</label>
        <div className={styles.passwordRow}>
          <input
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            autoComplete="current-password"
            autoFocus
            id="password"
            name="password"
            onChange={(event) => setValue(event.target.value)}
            ref={inputRef}
            required
            type={visible ? "text" : "password"}
            value={value}
          />
          <button
            aria-label={visible ? "Ocultar clave" : "Mostrar clave"}
            aria-pressed={visible}
            className={styles.passwordToggle}
            onClick={() => setVisible((current) => !current)}
            type="button"
          >
            {visible ? "Ocultar" : "Mostrar"}
          </button>
        </div>
        <p className={styles.fieldHelp} id={helpId}>Ingresá la clave que configuraste para entrar.</p>
        {error ? <p className={styles.error} id={errorId} role="alert">{error}</p> : null}
      </div>
      <LoginSubmit disabled={value.trim().length === 0} />
    </form>
  );
}
