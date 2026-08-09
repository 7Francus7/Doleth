"use client";

import { useActionState } from "react";
import { emptyAccountState } from "../../lib/auth/form-state";
import { StatusMessage } from "../../design-system/feedback";
import { SubmitButton } from "./SubmitButton";
import styles from "./integrations.module.css";

/**
 * Una integración, un botón.
 *
 * La tarjeta muestra siempre tres cosas en el mismo orden: **qué hace** esta
 * conexión, **cómo está** ahora, y el botón. Ese orden importa: alguien que abre
 * la pantalla por primera vez tiene que poder decidir si le sirve antes de
 * apretar nada, y alguien que vuelve tiene que ver de un vistazo si hace falta
 * apretar de nuevo.
 *
 * No hay estado "conectando" persistente ni tokens que administrar: estas
 * integraciones son consultas a fuentes públicas, no cuentas que se vinculan. Es
 * la razón por la que alcanzan con un botón.
 */
export interface IntegrationCardProps {
  title: string;
  /** Qué consigue la persona apretando. Concreto, no promocional. */
  description: string;
  /** Estado actual: última actualización, o qué falta para poder usarla. */
  status: string;
  /** `true` cuando ya trajo datos alguna vez. */
  connected: boolean;
  buttonLabel: string;
  pendingLabel: string;
  action: () => Promise<{ status: string; message: string; errors: Record<string, string> }>;
  /** Nota al pie: límites conocidos de esta integración. */
  note?: string;
}

export function IntegrationCard({
  title,
  description,
  status,
  connected,
  buttonLabel,
  pendingLabel,
  action,
  note,
}: IntegrationCardProps) {
  const [state, formAction] = useActionState(action, emptyAccountState);

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {/*
          El estado se dice con palabras además del color. "Conectada" en verde y
          "sin conectar" en gris se distinguen mal en una pantalla al sol, y la
          diferencia entre las dos cambia si los números que estás mirando son de
          hoy o de nunca.
        */}
        <span className={styles.badge} data-connected={connected || undefined}>
          {connected ? "Conectada" : "Sin conectar"}
        </span>
      </header>

      <p className={styles.description}>{description}</p>
      <p className={styles.status}>{status}</p>

      {state.status !== "idle" && state.message ? (
        <StatusMessage tone={state.status === "success" ? "success" : "error"}>{state.message}</StatusMessage>
      ) : null}

      <form action={formAction}>
        <SubmitButton pendingLabel={pendingLabel}>{buttonLabel}</SubmitButton>
      </form>

      {note ? <p className={styles.note}>{note}</p> : null}
    </section>
  );
}
