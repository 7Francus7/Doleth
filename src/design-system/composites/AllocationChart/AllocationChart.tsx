"use client";

import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { motionCurve, motionDuration } from "../../tokens";
import { NumericValue } from "../../primitives/NumericValue";
import styles from "./AllocationChart.module.css";

export type AllocationDeltaState = "positive" | "negative" | "neutral";

export interface AllocationSegment {
  id: string;
  label: string;
  /** Formatted current value without prefix, e.g. "184.500". */
  value: string;
  valuePrefix?: string;
  /** Share of the total, 0-100. */
  allocationPercent: number;
  /** Formatted signed variation vs. cost basis, e.g. "12,4%". */
  deltaLabel?: string;
  deltaState?: AllocationDeltaState;
}

export interface AllocationChartProps {
  segments: readonly AllocationSegment[];
  /** Formatted total current value without prefix. */
  total: string;
  totalPrefix?: string;
  totalLabel?: string;
  emptyLabel?: string;
  className?: string;
}

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 6; // arc gap in path units

function percentText(value: number): string {
  return `${value.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`;
}

export function AllocationChart({
  segments,
  total,
  totalPrefix = "$",
  totalLabel = "Valor total",
  emptyLabel = "Todavía no hay inversiones cargadas.",
  className,
}: AllocationChartProps) {
  const reduceMotion = useReducedMotion();
  const baseId = useId();
  const [selected, setSelected] = useState(0);
  const activeIndex = Math.min(selected, Math.max(0, segments.length - 1));

  const arcs = useMemo(() => {
    const lengths = segments.map((segment) => (segment.allocationPercent / 100) * CIRCUMFERENCE);
    return lengths.map((length, index) => {
      const dash = Math.max(length - GAP, 0.001);
      const offset = lengths.slice(0, index).reduce((sum, value) => sum + value, 0);
      return { dash, gap: CIRCUMFERENCE - dash, offset };
    });
  }, [segments]);

  if (!segments.length) {
    return <p className={[styles.empty, className].filter(Boolean).join(" ")}>{emptyLabel}</p>;
  }

  const active = segments[activeIndex]!;

  const move = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = segments.length - 1;
    let next = activeIndex;
    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        next = activeIndex >= last ? 0 : activeIndex + 1;
        break;
      case "ArrowUp":
      case "ArrowLeft":
        next = activeIndex <= 0 ? last : activeIndex - 1;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = last;
        break;
      default:
        return;
    }
    event.preventDefault();
    setSelected(next);
    const list = event.currentTarget.parentElement;
    (list?.children[next] as HTMLButtonElement | undefined)?.focus();
  };

  return (
    <div className={[styles.allocation, className].filter(Boolean).join(" ")}>
      <div className={styles.ringWrap}>
        <svg className={styles.ring} viewBox="0 0 140 140" aria-hidden="true">
          <circle className={styles.track} cx="70" cy="70" r={RADIUS} />
          <g transform="rotate(-90 70 70)">
            {segments.map((segment, index) => {
              const arc = arcs[index]!;
              const isActive = index === activeIndex;
              return (
                <circle
                  className={styles.segment}
                  cx="70"
                  cy="70"
                  data-active={isActive}
                  data-index={index % 6}
                  key={segment.id}
                  onClick={() => setSelected(index)}
                  r={RADIUS}
                  strokeDasharray={`${arc.dash} ${arc.gap}`}
                  strokeDashoffset={-arc.offset}
                />
              );
            })}
          </g>
        </svg>
        <div className={styles.center}>
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              className={styles.centerInner}
              key={active.id}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: motionDuration.micro, ease: motionCurve.exit } }}
              transition={{ duration: motionDuration.numeric, ease: motionCurve.settle }}
            >
              <span className={styles.centerShare}>{percentText(active.allocationPercent)}</span>
              <span className={styles.centerLabel}>{active.label}</span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className={styles.total}>
        <span className={styles.totalLabel}>{totalLabel}</span>
        <NumericValue prefix={totalPrefix} size="md" value={total} />
      </div>

      <div className={styles.legend} role="tablist" aria-label="Distribución de la cartera">
        {segments.map((segment, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              aria-controls={`${baseId}-center`}
              aria-selected={isActive}
              className={styles.legendRow}
              data-active={isActive}
              data-index={index % 6}
              key={segment.id}
              onClick={() => setSelected(index)}
              onKeyDown={move}
              role="tab"
              tabIndex={isActive ? 0 : -1}
              type="button"
            >
              <span className={styles.swatch} aria-hidden="true" />
              <span className={styles.legendCopy}>
                <span className={styles.legendLabel}>{segment.label}</span>
                <span className={styles.legendShare}>{percentText(segment.allocationPercent)}</span>
              </span>
              <span className={styles.legendValues}>
                <NumericValue prefix={segment.valuePrefix ?? "$"} size="sm" value={segment.value} />
                {segment.deltaLabel ? (
                  <span className={styles.delta} data-state={segment.deltaState ?? "neutral"}>
                    {segment.deltaLabel}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
