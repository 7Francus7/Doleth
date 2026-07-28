"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  cancelAccountDeletionAction,
  changePasswordAction,
  requestAccountDeletionAction,
  requestEmailChangeAction,
  revokeOtherSessionsAction,
  updateProfileAction,
} from "../../app/configuracion/cuenta/actions";
import { emptyAccountState } from "../../lib/auth/form-state";
import { currencyOptions, localeOptions, timeZoneOptions } from "../../lib/auth/validation";
import { AuthSubmit, PasswordField, TextField } from "./fields";
import styles from "./auth.module.css";
import settings from "./settings.module.css";

const TIME_ZONE_LABELS: Record<string, string> = {
  "America/Argentina/Buenos_Aires": "Buenos Aires (GMT-3)",
  "America/Argentina/Cordoba": "Córdoba (GMT-3)",
  "America/Argentina/Mendoza": "Mendoza (GMT-3)",
  "America/Argentina/Salta": "Salta (GMT-3)",
  "America/Argentina/Tucuman": "Tucumán (GMT-3)",
  "America/Montevideo": "Montevideo (GMT-3)",
  "America/Santiago": "Santiago de Chile",
  "Europe/Madrid": "Madrid",
};

const LOCALE_LABELS: Record<string, string> = {
  "es-AR": "Español (Argentina)",
  "es-ES": "Español (España)",
};

function Feedback({ state }: { state: { status: string; message: string } }) {
  if (state.status === "idle" || !state.message) return null;
  return (
    <p
      className={state.status === "success" ? styles.success : styles.error}
      role={state.status === "success" ? "status" : "alert"}
      tabIndex={-1}
    >
      {state.message}
    </p>
  );
}

export function ProfileSection({
  defaults,
}: {
  defaults: { name: string; primaryCurrency: string; timeZone: string; locale: string };
}) {
  const [state, action] = useActionState(updateProfileAction, emptyAccountState);

  return (
    <form action={action} className={styles.form} noValidate>
      <Feedback state={state} />
      <TextField
        autoComplete="name"
        defaultValue={defaults.name}
        error={state.errors.name}
        label="Nombre"
        maxLength={80}
        name="name"
        required
      />

      <div className={styles.field}>
        <label htmlFor="primaryCurrency">Moneda principal</label>
        <select defaultValue={defaults.primaryCurrency} id="primaryCurrency" name="primaryCurrency" required>
          {currencyOptions.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </select>
        {state.errors.primaryCurrency ? (
          <span className={styles.fieldError}>{state.errors.primaryCurrency}</span>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor="timeZone">Zona horaria</label>
        <select defaultValue={defaults.timeZone} id="timeZone" name="timeZone" required>
          {timeZoneOptions.map((zone) => (
            <option key={zone} value={zone}>
              {TIME_ZONE_LABELS[zone] ?? zone}
            </option>
          ))}
        </select>
        {state.errors.timeZone ? <span className={styles.fieldError}>{state.errors.timeZone}</span> : null}
      </div>

      <div className={styles.field}>
        <label htmlFor="locale">Formato regional</label>
        <select defaultValue={defaults.locale} id="locale" name="locale" required>
          {localeOptions.map((locale) => (
            <option key={locale} value={locale}>
              {LOCALE_LABELS[locale] ?? locale}
            </option>
          ))}
        </select>
        {state.errors.locale ? <span className={styles.fieldError}>{state.errors.locale}</span> : null}
      </div>

      <AuthSubmit pendingLabel="Guardando…">Guardar cambios</AuthSubmit>
    </form>
  );
}

export function ChangePasswordSection() {
  const [state, action] = useActionState(changePasswordAction, emptyAccountState);

  return (
    <form action={action} className={styles.form} noValidate>
      <Feedback state={state} />
      <PasswordField
        autoComplete="current-password"
        error={state.errors.currentPassword}
        label="Contraseña actual"
        name="currentPassword"
        required
      />
      <PasswordField
        autoComplete="new-password"
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
        hint="Al guardar se cierran las sesiones abiertas en otros dispositivos."
        label="Repetir contraseña nueva"
        minLength={10}
        name="passwordConfirmation"
        required
      />
      <AuthSubmit pendingLabel="Guardando…">Cambiar contraseña</AuthSubmit>
    </form>
  );
}

export function ChangeEmailSection({ currentEmail }: { currentEmail: string }) {
  const [state, action] = useActionState(requestEmailChangeAction, emptyAccountState);

  return (
    <form action={action} className={styles.form} noValidate>
      <Feedback state={state} />
      <p className={styles.hint}>
        Hoy entrás con <strong>{currentEmail}</strong>. El cambio se aplica recién cuando confirmás la dirección nueva.
      </p>
      <TextField
        autoComplete="email"
        error={state.errors.newEmail}
        inputMode="email"
        label="Correo nuevo"
        maxLength={254}
        name="newEmail"
        placeholder="vos@ejemplo.com"
        required
        type="email"
      />
      <PasswordField
        autoComplete="current-password"
        error={state.errors.currentPassword}
        label="Tu contraseña actual"
        name="currentPassword"
        required
      />
      <AuthSubmit kind="secondary" pendingLabel="Enviando…">
        Enviar confirmación
      </AuthSubmit>
    </form>
  );
}

export function SessionsSection({
  sessions,
  currentSessionId,
}: {
  sessions: { id: string; createdAt: string; lastSeenAt: string; device: string }[];
  currentSessionId: string;
}) {
  const [state, action] = useActionState(revokeOtherSessionsAction, emptyAccountState);
  const others = sessions.filter((session) => session.id !== currentSessionId).length;

  return (
    <div className={styles.form}>
      <Feedback state={state} />
      <ul className={settings.sessionList}>
        {sessions.map((session) => (
          <li className={settings.sessionRow} key={session.id}>
            <span className={settings.sessionDevice}>
              {session.device}
              {session.id === currentSessionId ? <em className={settings.badge}>Esta sesión</em> : null}
            </span>
            <span className={settings.sessionMeta}>
              Iniciada el {session.createdAt} · última actividad {session.lastSeenAt}
            </span>
          </li>
        ))}
      </ul>
      <form action={action}>
        <AuthSubmit kind="secondary" pendingLabel="Cerrando…">
          {others > 0 ? `Cerrar las otras ${others} sesiones` : "Cerrar otras sesiones"}
        </AuthSubmit>
      </form>
    </div>
  );
}

export function DeleteAccountSection({ requestedOn }: { requestedOn: string | null }) {
  const [requestState, requestAction] = useActionState(requestAccountDeletionAction, emptyAccountState);
  const [cancelState, cancelAction] = useActionState(cancelAccountDeletionAction, emptyAccountState);

  if (requestedOn) {
    return (
      <div className={styles.form}>
        <Feedback state={cancelState} />
        <p className={styles.notice}>
          Pediste la baja el {requestedOn}. Tus datos siguen intactos mientras procesamos el pedido. Podés cancelarlo
          cuando quieras.
        </p>
        <form action={cancelAction}>
          <AuthSubmit kind="secondary" pendingLabel="Cancelando…">
            Cancelar el pedido de baja
          </AuthSubmit>
        </form>
      </div>
    );
  }

  return (
    <form action={requestAction} className={styles.form} noValidate>
      <Feedback state={requestState} />
      <div className={settings.consequences}>
        <p>Al pedir la baja:</p>
        <ul>
          <li>Se registra tu pedido y lo procesamos de forma manual.</li>
          <li>Tus cuentas, movimientos e inversiones dejan de estar accesibles desde la aplicación.</li>
          <li>Podés cancelar el pedido mientras no lo hayamos ejecutado.</li>
        </ul>
        <p>
          Antes de pedirla, guardá lo que necesites: el historial completo está en{" "}
          <Link className={styles.link} href="/movimientos">
            Movimientos
          </Link>
          .
        </p>
      </div>
      <TextField
        autoComplete="off"
        error={requestState.errors.confirmation}
        hint="Escribí ELIMINAR en mayúsculas para confirmar que entendés las consecuencias."
        label="Confirmación"
        name="confirmation"
        placeholder="ELIMINAR"
        required
      />
      <PasswordField
        autoComplete="current-password"
        error={requestState.errors.currentPassword}
        label="Tu contraseña actual"
        name="currentPassword"
        required
      />
      <AuthSubmit kind="ghost" pendingLabel="Registrando…">
        Pedir la baja de mi cuenta
      </AuthSubmit>
    </form>
  );
}
