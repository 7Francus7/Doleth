"use client";

import Link from "next/link";
import { useActionState } from "react";
import { confirmEmailChangeAction } from "../../app/configuracion/cuenta/actions";
import { emptyAccountState } from "../../lib/auth/form-state";
import { AuthSubmit } from "./fields";
import styles from "./auth.module.css";

export function ConfirmEmailChangeForm({ token }: { token: string }) {
  const [state, action] = useActionState(confirmEmailChangeAction, emptyAccountState);

  if (state.status === "success") {
    return (
      <div className={styles.form}>
        <p className={styles.success} role="status" tabIndex={-1}>
          {state.message}
        </p>
        <Link className={styles.link} href="/configuracion/cuenta">
          Volver a mi cuenta
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className={styles.form}>
      <input name="token" type="hidden" value={token} />
      {state.status === "error" && state.message ? (
        <p className={styles.error} role="alert" tabIndex={-1}>
          {state.message}
        </p>
      ) : null}
      <AuthSubmit pendingLabel="Confirmando…">Confirmar dirección nueva</AuthSubmit>
    </form>
  );
}
