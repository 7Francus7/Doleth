import Link from "next/link";
import { ErrorState } from "../design-system/feedback";
import styles from "./error.module.css";

export default function NotFound() {
  return (
    <main className={styles.canvas}>
      <div className={styles.content}>
        <ErrorState
          description="Puede que el enlace haya cambiado o que la pantalla ya no esté disponible."
          primaryAction={
            <Link className={styles.secondary} href="/ahora">
              Volver a Ahora
            </Link>
          }
          title="Esta parte de Doleth no existe."
          variant="screen"
        />
      </div>
    </main>
  );
}
