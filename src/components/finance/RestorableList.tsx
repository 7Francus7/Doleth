"use client";

import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import {
  hasEnoughHeight,
  isRestorableNavigation,
  parseSavedPosition,
  scrollStorageKey,
} from "../../lib/navigation/scrollRestoration";

/** Ventana máxima para que la posición se sostenga. Acotada: nunca queda observando. */
const SETTLE_BUDGET_MS = 1200;
/** Frames consecutivos en los que la posición debe mantenerse para darla por buena. */
const FRAMES_TO_SETTLE = 3;

export interface RestorableListProps {
  /** Ruta normalizada de esta lista: define la identidad de la posición guardada. */
  restorationKey: string;
  className?: string | undefined;
  children: ReactNode;
}

/**
 * Contenedor de listas que recuerdan dónde estabas.
 *
 * GUARDRAIL ARQUITECTÓNICO
 * Este componente debe renderizar un nodo DOM para hidratar.
 * Un client component que devuelve `null` no recibe ancla de hidratación y su
 * efecto nunca llega a ejecutarse, que fue exactamente por lo que la
 * restauración no funcionaba. No lo conviertas en un componente sin DOM ni
 * muevas el efecto a un wrapper vacío.
 *
 * (Esto vale para este contenedor, no para todo client component: un componente
 * sin DOM es válido cuando no depende de un efecto sobre su propio nodo.)
 *
 * Guarda la posición al navegar a un detalle (delegación local sobre sus propias
 * filas, sin listeners globales) y la restaura al volver, una sola vez.
 */
export function RestorableList({ restorationKey, className, children }: RestorableListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const key = scrollStorageKey(restorationKey);

    let target: number | null = null;
    try {
      target = parseSavedPosition(sessionStorage.getItem(key));
    } catch {
      target = null;
    }
    if (target === null) return;

    const goal = target;
    let cancelled = false;
    let frame = 0;
    let settled = 0;
    let observer: ResizeObserver | null = null;
    const deadline = performance.now() + SETTLE_BUDGET_MS;

    const stop = () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchstart", cancel);
      window.removeEventListener("keydown", cancel);
    };

    function cancel() {
      cancelled = true;
      stop();
    }

    // El router lleva el scroll al tope después de montar, así que reaplicamos
    // hasta que la posición se sostenga unos frames o se agote el presupuesto.
    const step = () => {
      if (cancelled) return;
      if (hasEnoughHeight(document.documentElement.scrollHeight, window.innerHeight, goal)) {
        if (Math.abs(window.scrollY - goal) <= 2) {
          settled += 1;
          if (settled >= FRAMES_TO_SETTLE) {
            try {
              sessionStorage.removeItem(key);
            } catch {
              // Nada que limpiar si el storage no está disponible.
            }
            stop();
            return;
          }
        } else {
          settled = 0;
          window.scrollTo(0, goal);
        }
      }
      if (performance.now() < deadline) {
        frame = requestAnimationFrame(step);
        return;
      }
      stop();
    };

    // Si la persona ya empezó a moverse por su cuenta, no la reubicamos.
    window.addEventListener("wheel", cancel, { passive: true });
    window.addEventListener("touchstart", cancel, { passive: true });
    window.addEventListener("keydown", cancel);

    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      observer = new ResizeObserver(() => {
        if (!cancelled) step();
      });
      observer.observe(containerRef.current);
    }

    frame = requestAnimationFrame(step);
    return stop;
  }, [restorationKey]);

  const save = () => {
    try {
      sessionStorage.setItem(scrollStorageKey(restorationKey), String(Math.round(window.scrollY)));
    } catch {
      // sessionStorage puede no estar disponible; degradar en silencio.
    }
  };

  // Fase de captura sobre las propias filas: corre antes de que el router
  // empiece a navegar, cuando window.scrollY todavía es la posición real.
  const handleClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!isRestorableNavigation(event)) return;
    if (!(event.target as HTMLElement).closest("a[href]")) return;
    save();
  };

  // El teclado navega con Enter sobre el enlace enfocado: ese caso no pasa por
  // click, así que se guarda también acá.
  const handleKeyDownCapture = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter") return;
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!(event.target as HTMLElement).closest("a[href]")) return;
    save();
  };

  useEffect(() => {
    const onPageHide = () => save();
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  });

  return (
    <div
      className={className}
      onClickCapture={handleClickCapture}
      onKeyDownCapture={handleKeyDownCapture}
      ref={containerRef}
    >
      {children}
    </div>
  );
}
