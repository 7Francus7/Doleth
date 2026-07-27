"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./PwaManager.module.css";

type PwaNoticeProps =
  | { kind: "offline"; onLater?: never; onUpdate?: never }
  | { kind: "update"; onLater: () => void; onUpdate: () => void };

export function PwaNotice(props: PwaNoticeProps) {
  if (props.kind === "offline") {
    return (
      <div className={styles.offline} role="status">
        Sin conexión. Doleth no muestra datos financieros sin acceso a la fuente.
      </div>
    );
  }
  return (
    <section aria-labelledby="update-title" className={styles.update} role="status">
      <div>
        <p className={styles.updateTitle} id="update-title">Hay una versión nueva</p>
        <p className={styles.updateCopy}>
          Actualizá cuando termines lo que estás haciendo. No se recargará sola.
        </p>
      </div>
      <div className={styles.updateActions}>
        <button className={styles.later} onClick={props.onLater} type="button">
          Más tarde
        </button>
        <button className={styles.apply} onClick={props.onUpdate} type="button">
          Actualizar
        </button>
      </div>
    </section>
  );
}

const FORM_ROUTE =
  /(?:\/nuevo|\/editar)$|^\/proximo\/[^/]+$|^\/ingresar$/;

export function PwaManager() {
  const pathname = usePathname();
  const [online, setOnline] = useState(true);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    let active = true;
    const inspect = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting && navigator.serviceWorker.controller) {
        setWaiting(registration.waiting);
      }
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        worker?.addEventListener("statechange", () => {
          if (active && worker.state === "installed" && navigator.serviceWorker.controller) {
            setWaiting(worker);
            setDismissed(false);
          }
        });
      });
    };
    navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    }).then(inspect).catch(() => {
      // La app sigue siendo web normal si el navegador no puede registrar la PWA.
    });
    return () => {
      active = false;
    };
  }, []);

  const applyUpdate = () => {
    if (!waiting) return;
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => window.location.reload(),
      { once: true },
    );
    waiting.postMessage({ type: "SKIP_WAITING" });
  };

  return (
    <>
      {!online ? <PwaNotice kind="offline" /> : null}
      {waiting && !dismissed && !FORM_ROUTE.test(pathname) ? (
        <PwaNotice
          kind="update"
          onLater={() => setDismissed(true)}
          onUpdate={applyUpdate}
        />
      ) : null}
    </>
  );
}
