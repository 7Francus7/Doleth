"use client";

import { useActionState } from "react";
import { resendVerificationAction } from "../../app/auth/actions";
import { emptyAuthState } from "../../lib/auth/form-state";
import { AuthSubmit, TextField } from "./fields";
import styles from "./auth.module.css";

export function ResendVerificationForm({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [state, action] = useActionState(resendVerificationAction, emptyAuthState);

  return (
    <form action={action} className={styles.form} noValidate>
      {state.status !== "idle" && state.message ? (
        <p className={state.status === "success" ? styles.success : styles.error} role="status" tabIndex={-1}>
          {state.message}
        </p>
      ) : null}
      <TextField
        autoComplete="email"
        defaultValue={defaultEmail}
        inputMode="email"
        label="Correo"
        maxLength={254}
        name="email"
        placeholder="vos@ejemplo.com"
        required
        type="email"
      />
      <AuthSubmit kind="secondary" pendingLabel="Enviando…">
        Reenviar enlace
      </AuthSubmit>
    </form>
  );
}
