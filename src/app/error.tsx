"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "../design-system/primitives/Button";
import { ErrorState } from "../design-system/feedback";
import styles from "./error.module.css";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Registro solo para desarrollo; nunca se expone al usuario.
    if (process.env.NODE_ENV === "development") console.error(error);
  }, [error]);

  return (
    <main className={styles.canvas}>
      <div className={styles.content}>
        <ErrorState
          assertive
          description="No pudimos mostrar esta pantalla. El problema fue solo al cargarla."
          primaryAction={
            <Button kind="primary" onClick={reset} size="lg">
              Reintentar
            </Button>
          }
          safetyLine="Tus datos guardados siguen seguros."
          secondaryAction={
            <Link className={styles.secondary} href="/ahora">
              Volver a Ahora
            </Link>
          }
          title="Doleth no pudo cargar esta pantalla."
          variant="screen"
        />
      </div>
    </main>
  );
}
