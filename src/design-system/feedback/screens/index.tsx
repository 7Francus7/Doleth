import { Skeleton } from "../Skeleton";
import styles from "./screens.module.css";

// Composiciones de skeleton por familia de layout. Preservan la estructura de la
// pantalla real (cabecera, hero, listas) sin mostrar ningún dato ni texto: todo
// el árbol está oculto a lectores de pantalla mediante aria-busy en el contenedor.

function SkeletonRows({ count }: { count: number }) {
  return (
    <div className={styles.list}>
      {Array.from({ length: count }, (_, index) => (
        <div className={styles.rowItem} key={index}>
          <div className={styles.rowLine}>
            <div className={styles.rowCopy}>
              <Skeleton variant="line" width="55%" />
              <Skeleton variant="line" width="35%" height="0.625rem" />
            </div>
            <Skeleton variant="value" width="4.5rem" height="1.25rem" />
          </div>
        </div>
      ))}
    </div>
  );
}

export interface ShellSkeletonProps {
  /** Estructura dominante bajo la cabecera. */
  body?: "list" | "detail" | "form";
  /** Muestra una fila de filtros (historial). */
  filters?: boolean;
  /** Filas de lista (3–6). */
  rows?: number;
}

/**
 * Skeleton para rutas que usan OperationalShell (historial, cuentas, detalle,
 * formularios): marca + eyebrow + título y luego el cuerpo correspondiente.
 */
export function ShellSkeleton({ body = "list", filters = false, rows = 4 }: ShellSkeletonProps) {
  return (
    <main aria-busy="true" className={styles.canvas}>
      <div className={styles.content}>
        <div className={styles.header}>
          <Skeleton variant="line" width="6rem" height="0.75rem" />
          <Skeleton variant="line" width="9rem" height="0.75rem" />
          <Skeleton variant="value" width="12rem" height="1.75rem" />
        </div>
        {filters ? (
          <div className={styles.filters}>
            <Skeleton variant="block" height="2.75rem" />
            <Skeleton variant="block" height="2.75rem" />
            <Skeleton variant="block" height="2.75rem" />
          </div>
        ) : null}
        {body === "list" ? <SkeletonRows count={Math.min(6, Math.max(3, rows))} /> : null}
        {body === "detail" ? (
          <div className={styles.card}>
            <Skeleton variant="value" width="10rem" height="2rem" />
            <Skeleton variant="line" lines={4} />
            <Skeleton variant="block" height="3rem" width="12rem" />
          </div>
        ) : null}
        {body === "form" ? (
          <div className={styles.card}>
            <Skeleton variant="block" height="4.5rem" />
            <Skeleton variant="block" height="3rem" />
            <Skeleton variant="block" height="3rem" />
            <Skeleton variant="block" height="3.5rem" />
          </div>
        ) : null}
      </div>
    </main>
  );
}

export interface SurfaceSkeletonProps {
  /** Incluye un medidor/cobertura dentro del hero. */
  meter?: boolean;
  /** Bloques de sección bajo el hero. */
  sections?: number;
  /** Filas de lista al final (0 = sin lista). */
  rows?: number;
}

/**
 * Skeleton para rutas-feature con layout app-canvas (ahora, cambios, progreso,
 * mi-realidad, actuar, próximo, inversiones): título de pantalla + rail + hero +
 * secciones.
 */
export function SurfaceSkeleton({ meter = true, sections = 2, rows = 0 }: SurfaceSkeletonProps) {
  return (
    <main aria-busy="true" className={styles.canvas}>
      <div className={styles.content}>
        <Skeleton variant="value" width="9rem" height="1.5rem" />
        <Skeleton variant="line" width="70%" height="0.75rem" />
        <div className={`${styles.card} ${styles.hero}`}>
          <Skeleton variant="line" width="75%" />
          <Skeleton variant="value" width="10rem" height="2.5rem" />
          <Skeleton variant="line" width="55%" height="0.75rem" />
          {meter ? <Skeleton variant="block" height="2.5rem" /> : null}
        </div>
        {Array.from({ length: Math.max(0, sections) }, (_, index) => (
          <div className={styles.card} key={index}>
            <Skeleton variant="line" width="45%" />
            <Skeleton variant="line" lines={3} />
          </div>
        ))}
        {rows > 0 ? <SkeletonRows count={Math.min(6, Math.max(3, rows))} /> : null}
      </div>
    </main>
  );
}
