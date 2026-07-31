"use client";

import { useEffect, useState } from "react";

/**
 * Los enlaces privados llevan el token en el fragmento (#token=...).
 * El fragmento no viaja al servidor, al CDN ni al Referer. Se retira de la barra
 * apenas el cliente lo captura y sólo se envía en el cuerpo de la Server Action.
 */
export function usePrivateTokenFragment(): { token: string; ready: boolean } {
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const capturedToken = fragment.get("token") ?? "";
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    const update = window.setTimeout(() => {
      setToken(capturedToken);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(update);
  }, []);

  return { token, ready };
}
