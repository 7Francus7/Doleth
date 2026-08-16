"use client";

import { useActionState } from "react";
import {
  activatePendingUserAction,
  changeRoleAction,
  emptyAdminState,
  reactivateUserAction,
  suspendUserAction,
} from "./actions";
import styles from "./admin.module.css";

/**
 * Los botones de una fila del padrón.
 *
 * Cada operación es su propio formulario con su propio estado. Un estado
 * compartido haría que el resultado de suspender a alguien apareciera colgado
 * debajo de otra persona, que en una lista de nombres parecidos es exactamente
 * la confusión que no se puede permitir una pantalla que da de baja cuentas.
 */

function ActionForm({
  action,
  children,
  danger = false,
  fields,
}: {
  action: typeof suspendUserAction;
  children: string;
  danger?: boolean;
  fields: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(action, emptyAdminState);

  return (
    <form action={formAction} className={styles.actionForm}>
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} name={name} type="hidden" value={value} />
      ))}
      <button className={styles.action} data-danger={danger} disabled={pending} type="submit">
        {pending ? "…" : children}
      </button>
      {state.status !== "idle" ? (
        <span className={styles.actionResult} data-status={state.status} role="status">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}

export function AdminUserActions({
  isSelf,
  role,
  status,
  userId,
}: {
  isSelf: boolean;
  role: "USER" | "ADMIN";
  status: string;
  userId: string;
}) {
  // La fila propia no ofrece acciones sobre uno mismo. El servidor las rechaza
  // igual, pero un botón que sólo sirve para mostrar un error no debería existir.
  if (isSelf) return <p className={styles.selfNote}>Tu cuenta</p>;

  return (
    <div className={styles.actions}>
      {/*
        Una cuenta pendiente ofrece las dos cosas: dejarla entrar sin haber
        confirmado el correo, o suspenderla. "Reactivar" no sirve para nombrar
        esto —nunca estuvo activa— y su acción tampoco la alcanza.
      */}
      {status === "PENDING_VERIFICATION" ? (
        <ActionForm action={activatePendingUserAction} fields={{ userId }}>
          Dejar entrar
        </ActionForm>
      ) : null}

      {status === "SUSPENDED" ? (
        <ActionForm action={reactivateUserAction} fields={{ userId }}>
          Reactivar
        </ActionForm>
      ) : status === "DELETED" ? null : (
        <ActionForm action={suspendUserAction} danger fields={{ userId }}>
          Suspender
        </ActionForm>
      )}

      {status === "ACTIVE" || role === "ADMIN" ? (
        <ActionForm
          action={changeRoleAction}
          fields={{ userId, role: role === "ADMIN" ? "USER" : "ADMIN" }}
        >
          {role === "ADMIN" ? "Quitar admin" : "Hacer admin"}
        </ActionForm>
      ) : null}
    </div>
  );
}
