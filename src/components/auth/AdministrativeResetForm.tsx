"use client";

import { useActionState } from "react";
import { administrativeResetPasswordAction } from "../../app/auth/actions";
import { emptyAuthState } from "../../lib/auth/form-state";
import { AuthSubmit, PasswordField } from "./fields";
import { usePrivateTokenFragment } from "./private-token";
import styles from "./auth.module.css";

export function AdministrativeResetForm() {
  const [state, action] = useActionState(administrativeResetPasswordAction, emptyAuthState);
  const { token, ready } = usePrivateTokenFragment();

  return (
    <div className={styles.card}>
      <form action={action} className={styles.form} noValidate>
        <input name="token" type="hidden" value={token} />

        {ready && !token ? (
          <p className={styles.notice} role="status">
            Abrí el enlace temporal completo que te compartió el administrador.
          </p>
        ) : null}
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
          hint="El enlace vence en 30 minutos y se usa una sola vez."
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
