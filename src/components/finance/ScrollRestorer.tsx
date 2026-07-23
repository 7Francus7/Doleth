"use client";

import { useEffect } from "react";

/**
 * Guarda y restaura la posición de scroll de una lista, con clave por URL completa.
 * Como la clave incluye los filtros (query string), cambiar de filtro produce una
 * clave distinta y por lo tanto NO restaura una posición ajena: arranca desde arriba.
 * Al abrir un detalle, el componente se desmonta y persiste la posición; al volver
 * con "atrás" o con el enlace de retorno, se restaura.
 */
export function ScrollRestorer({ storageKey }: { storageKey: string }) {
  useEffect(() => {
    const key = `doleth:scroll:${storageKey}`;
    const restore = () => {
      const saved = sessionStorage.getItem(key);
      if (saved === null) return;
      const y = Number(saved);
      if (Number.isFinite(y)) window.scrollTo(0, y);
    };
    const save = () => {
      try {
        sessionStorage.setItem(key, String(window.scrollY));
      } catch {
        // sessionStorage puede no estar disponible; degradar en silencio.
      }
    };
    restore();
    window.addEventListener("pagehide", save);
    return () => {
      save();
      window.removeEventListener("pagehide", save);
    };
  }, [storageKey]);

  return null;
}
