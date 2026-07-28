"use client";

import { useActionState } from "react";
import { verifyEmailAction } from "../../app/auth/actions";
import { emptyAuthState } from "../../lib/auth/form-state";
import { AuthSubmit } from "./fields";
import styles from "./auth.module.css";

/**
 * La confirmación necesita un envío explícito, no basta con abrir el enlace.
 * Los antivirus y filtros de correo visitan las URLs de los mensajes: si el token
 * se consumiera en el GET, el enlace llegaría gastado a la persona.
 */
export function VerifyEmailForm({ token }: { token: string }) {
  const [state, action] = useActionState(verifyEmailAction, emptyAuthState);

  return (
    <form action={action} className={styles.form} noValidate>
      <input name="token" type="hidden" value={token} />
      {state.status === "error" && state.message ? (
        <p className={styles.error} role="alert" tabIndex={-1}>
          {state.message}
        </p>
      ) : null}
      <AuthSubmit pendingLabel="Confirmando…">Confirmar mi correo</AuthSubmit>
    </form>
  );
}
