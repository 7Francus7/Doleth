"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "../../app/auth/actions";
import { emptyAuthState } from "../../lib/auth/form-state";
import { AuthSubmit, PasswordField } from "./fields";
import styles from "./auth.module.css";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, emptyAuthState);

  return (
    <div className={styles.card}>
      <form action={action} className={styles.form} noValidate>
        <input name="token" type="hidden" value={token} />

        {state.status === "error" && state.message ? (
          <p className={styles.error} role="alert" tabIndex={-1}>
            {state.message}
          </p>
        ) : null}

        <PasswordField
          autoComplete="new-password"
          autoFocus
          error={state.errors.password}
          label="Contraseña nueva"
          minLength={10}
          name="password"
          required
          showStrength
        />
        <PasswordField
          autoComplete="new-password"
          error={state.errors.passwordConfirmation}
          hint="Al guardar se cierran todas las sesiones abiertas en otros dispositivos."
          label="Repetir contraseña"
          minLength={10}
          name="passwordConfirmation"
          required
        />

        <AuthSubmit pendingLabel="Guardando…">Guardar contraseña</AuthSubmit>
      </form>
    </div>
  );
}
