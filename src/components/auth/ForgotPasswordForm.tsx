"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordResetAction } from "../../app/auth/actions";
import { emptyAuthState } from "../../lib/auth/form-state";
import { AuthSubmit, TextField } from "./fields";
import styles from "./auth.module.css";

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordResetAction, emptyAuthState);

  return (
    <div className={styles.card}>
      <form action={action} className={styles.form} noValidate>
        {state.status !== "idle" && state.message ? (
          <p
            className={state.status === "success" ? styles.success : styles.error}
            role={state.status === "success" ? "status" : "alert"}
            tabIndex={-1}
          >
            {state.message}
          </p>
        ) : null}

        <TextField
          autoComplete="email"
          autoFocus
          error={state.errors.email}
          hint="Te mandamos un enlace que vence en una hora y se usa una sola vez."
          inputMode="email"
          label="Correo"
          maxLength={254}
          name="email"
          placeholder="vos@ejemplo.com"
          required
          type="email"
        />

        <AuthSubmit pendingLabel="Enviando…">Enviar enlace</AuthSubmit>
      </form>

      <div className={styles.footerLinks}>
        <Link className={styles.link} href="/iniciar-sesion">
          Volver a iniciar sesión
        </Link>
        <Link className={styles.link} href="/crear-cuenta">
          Crear una cuenta
        </Link>
      </div>
    </div>
  );
}
