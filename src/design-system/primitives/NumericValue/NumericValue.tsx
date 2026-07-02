import type { ComponentPropsWithoutRef } from "react";
import styles from "./NumericValue.module.css";

export type NumericValueSize = "sm" | "md" | "lg" | "xl";
export type NumericValueTone = "neutral" | "accent" | "attention" | "critical";
export type NumericValueFormat = "currency" | "percent" | "plain";
export type NumericValueDelta = "none" | "up" | "down" | "mixed";
export type NumericValueState = "confirmed" | "partial" | "estimated" | "unavailable";

export interface NumericValueProps extends Omit<ComponentPropsWithoutRef<"span">, "prefix"> {
  value: string;
  prefix?: string;
  suffix?: string;
  size?: NumericValueSize;
  tone?: NumericValueTone;
  format?: NumericValueFormat;
  delta?: NumericValueDelta;
  deltaValue?: string;
  state?: NumericValueState;
  unavailableLabel?: string;
}

export function NumericValue({
  value,
  prefix,
  suffix,
  size = "md",
  tone = "neutral",
  format = "plain",
  delta = "none",
  deltaValue,
  state = "confirmed",
  unavailableLabel = "No disponible",
  className,
  ...props
}: NumericValueProps) {
  const classes = [
    styles.numericValue,
    styles[`size-${size}`],
    styles[`tone-${tone}`],
    styles[`state-${state}`],
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const displayValue = state === "unavailable" ? unavailableLabel : value;

  return (
    <span className={classes} data-format={format} data-state={state} {...props}>
      <span className={styles.value}>
        {state !== "unavailable" && prefix ? <span>{prefix}</span> : null}
        <span>{displayValue}</span>
        {state !== "unavailable" && suffix ? <span>{suffix}</span> : null}
      </span>
      {delta !== "none" && deltaValue ? (
        <span className={styles.delta} data-direction={delta}>
          {deltaValue}
        </span>
      ) : null}
    </span>
  );
}
