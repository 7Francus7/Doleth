"use client";

import { useMemo, useRef, useState } from "react";
import { BottomSheet } from "../../design-system/composites/BottomSheet";
import styles from "./MovementForm.module.css";

export interface TactileOption {
  id: string;
  name: string;
  meta?: string | undefined;
}

export function TactileSelect({
  id,
  label,
  name,
  value,
  options,
  placeholder,
  onChange,
  error,
}: {
  id: string;
  label: string;
  name: string;
  value: string;
  options: readonly TactileOption[];
  placeholder: string;
  onChange: (value: string) => void;
  error?: string | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selected = options.find((option) => option.id === value);
  const searchable = options.length > 6;
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    if (!normalized) return options;
    return options.filter((option) => `${option.name} ${option.meta ?? ""}`.toLocaleLowerCase("es").includes(normalized));
  }, [options, query]);

  return (
    <div className={styles.pickerField}>
      <span className={styles.fieldLabel}>{label}</span>
      <input name={name} type="hidden" value={value} />
      <button
        aria-describedby={error ? `${id}-error` : undefined}
        aria-haspopup="dialog"
        aria-label={`${label}: ${selected?.name ?? placeholder}`}
        className={styles.pickerTrigger}
        id={id}
        onClick={() => setOpen(true)}
        ref={triggerRef}
        type="button"
      >
        <span className={selected ? styles.pickerValue : styles.pickerPlaceholder}>
          {selected?.name ?? placeholder}
        </span>
        {selected?.meta ? <small>{selected.meta}</small> : null}
        <span aria-hidden="true" className={styles.pickerArrow}>↓</span>
      </button>
      {error ? <p className={styles.inlineError} id={`${id}-error`} role="alert">{error}</p> : null}
      <BottomSheet
        height={searchable ? "full" : "auto"}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery("");
        }}
        open={open}
        returnFocusRef={triggerRef}
        subtitle={`${options.length} ${options.length === 1 ? "opción disponible" : "opciones disponibles"}`}
        title={label}
      >
        {searchable ? (
          <label className={styles.pickerSearch}>
            <span>Buscar</span>
            <input autoFocus onChange={(event) => setQuery(event.target.value)} placeholder={`Buscar ${label.toLocaleLowerCase("es")}`} type="search" value={query} />
          </label>
        ) : null}
        <div className={styles.pickerOptions} role="listbox" aria-label={label}>
          {filtered.map((option) => (
            <button
              aria-selected={option.id === value}
              className={styles.pickerOption}
              key={option.id}
              onClick={() => {
                onChange(option.id);
                setOpen(false);
              }}
              role="option"
              type="button"
            >
              <span>{option.name}</span>
              {option.meta ? <small>{option.meta}</small> : null}
              {option.id === value ? <strong aria-hidden="true">✓</strong> : null}
            </button>
          ))}
          {filtered.length === 0 ? <p className={styles.noOptions}>No hay coincidencias.</p> : null}
        </div>
      </BottomSheet>
    </div>
  );
}
