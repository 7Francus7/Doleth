"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "../../app/auth/actions";
import { emptyAuthState } from "../../lib/auth/form-state";
import { AuthSubmit, PasswordField, TextField } from "./fields";
import styles from "./auth.module.css";

export function LoginForm({ destination }: { destination: string }) {
  const [state, action] = useActionState(loginAction, emptyAuthState);
  const needsVerification = Boolean(state.errors.unverified);

  return (
    <div className={styles.card}>
      <form action={action} className={styles.form} noValidate>
        {/* El destino se valida de nuevo en el servidor: acá sólo se transporta. */}
        <input name="destino" type="hidden" value={destination} />

        {state.status === "error" && state.message ? (
          <p className={needsVerification ? styles.notice : styles.error} role="alert" tabIndex={-1}>
            {state.message}
            {needsVerification ? (
              <Link className={styles.link} href="/crear-cuenta/revisa-tu-correo">
                Reenviar el enlace de confirmación
              </Link>
            ) : null}
          </p>
        ) : null}

        <TextField
          autoComplete="email"
          autoFocus
          error={state.errors.email}
          inputMode="email"
          label="Correo"
          maxLength={254}
          name="email"
          placeholder="vos@ejemplo.com"
          required
          type="email"
        />
        <PasswordField
          autoComplete="current-password"
          error={state.errors.password}
          label="Contraseña"
          name="password"
          required
        />

        <AuthSubmit pendingLabel="Entrando…">Entrar</AuthSubmit>
      </form>

      <div className={styles.footerLinks}>
        <Link className={styles.link} href="/olvide-mi-contrasena">
          Olvidé mi contraseña
        </Link>
        <Link className={styles.link} href="/crear-cuenta">
          Crear una cuenta
        </Link>
      </div>
    </div>
  );
}
