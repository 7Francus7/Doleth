import styles from "./DolethBrand.module.css";

export interface DolethBrandProps {
  className?: string;
  compact?: boolean;
}

export function DolethBrand({ className, compact = false }: DolethBrandProps) {
  return (
    <span className={[styles.brand, className].filter(Boolean).join(" ")} data-compact={compact || undefined}>
      <svg aria-hidden="true" className={styles.mark} fill="none" viewBox="0 0 48 48">
        <path className={styles.stem} d="M24 4v8M24 36v8" />
        <path className={styles.arcMain} d="M29.8 8A17 17 0 1 1 11 35" />
        <path className={styles.arcSupport} d="M8 30A17 17 0 0 1 13 11" />
        <path className={styles.diamondMain} d="m24 13 8 11-8 5-8-5 8-11Z" />
        <path className={styles.diamondSupport} d="m16 26 8 9 8-9-8 5-8-5Z" />
        <path className={styles.diamondShade} d="m24 13 8 11-8-3V13Z" />
      </svg>
      <span className={styles.wordmark}>Doleth</span>
    </span>
  );
}
