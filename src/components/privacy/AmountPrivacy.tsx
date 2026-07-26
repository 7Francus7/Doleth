"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import styles from "./AmountPrivacy.module.css";

export const AMOUNT_PRIVACY_STORAGE_KEY = "doleth.hideAmounts";

interface AmountPrivacyValue {
  hidden: boolean;
  setHidden: (hidden: boolean) => void;
}

const AmountPrivacyContext = createContext<AmountPrivacyValue>({
  hidden: false,
  setHidden() {},
});

function syncDocument(hidden: boolean) {
  document.documentElement.dataset.amountsHidden = hidden ? "true" : "false";
}

function readHiddenPreference() {
  return window.localStorage.getItem(AMOUNT_PRIVACY_STORAGE_KEY) === "true";
}

function subscribe(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== AMOUNT_PRIVACY_STORAGE_KEY) return;
    syncDocument(readHiddenPreference());
    listener();
  };
  const onLocalChange = () => listener();
  window.addEventListener("storage", onStorage);
  window.addEventListener("doleth:amount-privacy", onLocalChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("doleth:amount-privacy", onLocalChange);
  };
}

export function AmountPrivacyProvider({ children }: { children: ReactNode }) {
  const hidden = useSyncExternalStore(subscribe, readHiddenPreference, () => false);

  const value = useMemo<AmountPrivacyValue>(
    () => ({
      hidden,
      setHidden(nextHidden) {
        window.localStorage.setItem(AMOUNT_PRIVACY_STORAGE_KEY, String(nextHidden));
        syncDocument(nextHidden);
        window.dispatchEvent(new Event("doleth:amount-privacy"));
      },
    }),
    [hidden],
  );

  return (
    <AmountPrivacyContext.Provider value={value}>
      {children}
    </AmountPrivacyContext.Provider>
  );
}

export function useAmountPrivacy(): AmountPrivacyValue {
  return useContext(AmountPrivacyContext);
}

export function SensitiveAmount({
  children,
  sensitive = true,
  className,
}: {
  children: ReactNode;
  sensitive?: boolean;
  className?: string;
}) {
  const { hidden } = useAmountPrivacy();
  if (!sensitive) return <>{children}</>;

  return (
    <span
      aria-label={hidden ? "Importe oculto" : undefined}
      className={[styles.amount, className].filter(Boolean).join(" ")}
      data-sensitive-amount
    >
      <span aria-hidden={hidden || undefined} className={styles.visible}>
        {children}
      </span>
      <span aria-hidden={!hidden} className={styles.mask}>
        ••••••
      </span>
    </span>
  );
}

const MONEY_IN_TEXT = /([+-]?\$\s?\d[\d.]*(?:,\d+)?)/g;
const MONEY_TOKEN = /^[+-]?\$\s?\d[\d.]*(?:,\d+)?$/;

export function SensitiveText({ children }: { children: string }) {
  const parts = children.split(MONEY_IN_TEXT);

  return (
    <>
      {parts.map((part, index) =>
        MONEY_TOKEN.test(part) ? (
          <SensitiveAmount key={`${part}-${index}`}>{part}</SensitiveAmount>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function AmountPrivacyToggle() {
  const { hidden, setHidden } = useAmountPrivacy();
  return (
    <button
      aria-checked={hidden}
      className={styles.toggle}
      onClick={() => setHidden(!hidden)}
      role="switch"
      type="button"
    >
      <span className={styles.toggleCopy}>
        <span className={styles.toggleLabel}>Ocultar importes</span>
        <span className={styles.toggleHint}>
          {hidden ? "Los importes están ocultos en este dispositivo." : "Evita miradas accidentales a la pantalla."}
        </span>
      </span>
      <span aria-hidden="true" className={styles.switchTrack} data-checked={hidden}>
        <span className={styles.switchThumb} />
      </span>
    </button>
  );
}
