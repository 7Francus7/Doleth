"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "../../app/auth/actions";
import { emptyAuthState } from "../../lib/auth/form-state";
import { AuthSubmit, CheckboxField, PasswordField, TextField } from "./fields";
import styles from "./auth.module.css";

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, emptyAuthState);

  return (
    <div className={styles.card}>
      <form action={action} className={styles.form} noValidate>
        {state.status === "error" && state.message ? (
          <p className={styles.error} role="alert" tabIndex={-1}>
            {state.message}
          </p>
        ) : null}

        <TextField
          autoComplete="name"
          error={state.errors.name}
          label="Nombre"
          maxLength={80}
          name="name"
          placeholder="Cómo querés que te llamemos"
          required
        />
        <TextField
          autoComplete="email"
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
          autoComplete="new-password"
          error={state.errors.password}
          label="Contraseña"
          minLength={10}
          name="password"
          required
          showStrength
        />
        <PasswordField
          autoComplete="new-password"
          error={state.errors.passwordConfirmation}
          label="Repetir contraseña"
          minLength={10}
          name="passwordConfirmation"
          required
        />
        <CheckboxField
          error={state.errors.acceptedTerms}
          label={
            <>
              Acepto los{" "}
              <Link className={styles.link} href="/terminos">
                términos
              </Link>{" "}
              y la{" "}
              <Link className={styles.link} href="/privacidad">
                política de privacidad
              </Link>
              .
            </>
          }
          name="acceptedTerms"
        />

        <AuthSubmit pendingLabel="Creando tu cuenta…">Crear cuenta</AuthSubmit>
      </form>

      <div className={styles.footerLinks}>
        <p>¿Ya tenés cuenta?</p>
        <Link className={styles.link} href="/iniciar-sesion">
          Iniciar sesión
        </Link>
      </div>
    </div>
  );
}
