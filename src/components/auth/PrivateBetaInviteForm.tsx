"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerWithInvitationAction } from "../../app/auth/actions";
import { emptyAuthState } from "../../lib/auth/form-state";
import { AuthSubmit, CheckboxField, PasswordField, TextField } from "./fields";
import { usePrivateTokenFragment } from "./private-token";
import styles from "./auth.module.css";

export function PrivateBetaInviteForm() {
  const [state, action] = useActionState(registerWithInvitationAction, emptyAuthState);
  const { token, ready } = usePrivateTokenFragment();

  return (
    <div className={styles.card}>
      <form action={action} className={styles.form} noValidate>
        <input name="token" type="hidden" value={token} />

        {ready && !token ? (
          <p className={styles.notice} role="status">
            Este acceso necesita el enlace privado completo que te compartió quien te invitó.
          </p>
        ) : null}
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
          hint="Usá el mismo correo al que fue dirigida la invitación."
          inputMode="email"
          label="Correo invitado"
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

        <AuthSubmit pendingLabel="Activando acceso…">Entrar a la beta privada</AuthSubmit>
      </form>

      <div className={styles.footerLinks}>
        <p>¿Ya activaste tu cuenta?</p>
        <Link className={styles.link} href="/iniciar-sesion">
          Iniciar sesión
        </Link>
      </div>
    </div>
  );
}
