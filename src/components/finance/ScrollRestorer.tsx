"use client";

import { useEffect } from "react";

/**
 * Guarda y restaura la posición de scroll de una lista, con clave por URL completa.
 * Como la clave incluye los filtros (query string), cambiar de filtro produce una
 * clave distinta y por lo tanto NO restaura una posición ajena: arranca desde arriba.
 *
 * La posición se captura en la FASE DE CAPTURA del click, antes de que el router
 * empiece a navegar. No sirve leerla al desmontar: para entonces Next ya llevó el
 * scroll al tope y `window.scrollY` siempre valdría 0.
 */
export function ScrollRestorer({ storageKey }: { storageKey: string }) {
  useEffect(() => {
    const key = `doleth:scroll:${storageKey}`;

    const save = () => {
      try {
        sessionStorage.setItem(key, String(Math.round(window.scrollY)));
      } catch {
        // sessionStorage puede no estar disponible; degradar en silencio.
      }
    };

    // El router lleva el scroll al tope DESPUÉS de montar, así que reintentamos
    // unos frames hasta que la posición se sostenga. Si la lista quedó más corta,
    // los intentos se agotan y la página simplemente queda donde puede.
    let frame = 0;
    let attempts = 0;
    const applyUntilItSticks = (y: number) => {
      window.scrollTo(0, y);
      attempts += 1;
      if (attempts < 8 && Math.abs(window.scrollY - y) > 2) {
        frame = requestAnimationFrame(() => applyUntilItSticks(y));
      }
    };

    try {
      const saved = sessionStorage.getItem(key);
      if (saved !== null) {
        const y = Number(saved);
        if (Number.isFinite(y) && y > 0) {
          frame = requestAnimationFrame(() => applyUntilItSticks(y));
        }
      }
    } catch {
      // Sin estado previo utilizable: se queda arriba.
    }

    document.addEventListener("click", save, true);
    window.addEventListener("pagehide", save);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("click", save, true);
      window.removeEventListener("pagehide", save);
    };
  }, [storageKey]);

  return null;
}
