"use client";

import { useId, useMemo, useState, type CSSProperties, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { motionCurve, motionDuration, motionSequence } from "../../tokens";
import { Divider } from "../../primitives/Divider";
import { NumericValue } from "../../primitives/NumericValue";
import styles from "./TrendChart.module.css";

export type TrendNetState = "positive" | "negative" | "neutral";

export interface TrendPoint {
  /** Stable key, e.g. "2026-07". */
  month: string;
  /** Short axis label, e.g. "Jul". */
  label: string;
  /** Formatted income without prefix, e.g. "120.000". */
  income: string;
  /** Formatted expense without prefix. */
  expense: string;
  /** Formatted absolute net without prefix. */
  net: string;
  /** Prefix that carries the sign, e.g. "+$" or "-$". */
  netPrefix: string;
  netState: TrendNetState;
  /** Bar height as a percentage 0-100 of the chart area. */
  incomePercent: number;
  expensePercent: number;
}

export interface TrendChartProps {
  points: readonly TrendPoint[];
  incomeLabel?: string;
  expenseLabel?: string;
  netLabel?: string;
  emptyLabel?: string;
  className?: string;
}

const ACTIVITY_THRESHOLD = 4;

function findDefaultIndex(points: readonly TrendPoint[]): number {
  for (let index = points.length - 1; index >= 0; index -= 1) {
    const point = points[index]!;
    if (point.incomePercent > ACTIVITY_THRESHOLD || point.expensePercent > ACTIVITY_THRESHOLD) {
      return index;
    }
  }
  return Math.max(0, points.length - 1);
}

export function TrendChart({
  points,
  incomeLabel = "Ingresos",
  expenseLabel = "Gastos",
  netLabel = "Balance",
  emptyLabel = "Aún no hay movimientos para comparar.",
  className,
}: TrendChartProps) {
  const reduceMotion = useReducedMotion();
  const baseId = useId();
  const defaultIndex = useMemo(() => findDefaultIndex(points), [points]);
  const [selected, setSelected] = useState(defaultIndex);
  const activeIndex = Math.min(selected, Math.max(0, points.length - 1));

  const hasActivity = points.some(
    (point) => point.incomePercent > ACTIVITY_THRESHOLD || point.expensePercent > ACTIVITY_THRESHOLD,
  );
  const active = points[activeIndex];

  const move = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = points.length - 1;
    let next = activeIndex;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowUp":
        next = Math.min(last, activeIndex + 1);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        next = Math.max(0, activeIndex - 1);
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
    const target = event.currentTarget.parentElement?.children[next] as HTMLButtonElement | undefined;
    target?.focus();
  };

  if (!points.length) {
    return <p className={[styles.empty, className].filter(Boolean).join(" ")}>{emptyLabel}</p>;
  }

  const detailTransition = (order: number) => ({
    delay: reduceMotion ? 0 : order,
    duration: reduceMotion ? motionDuration.micro : motionDuration.numeric,
    ease: motionCurve.settle,
  });

  return (
    <div className={[styles.trend, className].filter(Boolean).join(" ")}>
      <div className={styles.header}>
        <div className={styles.legend} aria-hidden="true">
          <span><i data-kind="income" />{incomeLabel}</span>
          <span><i data-kind="expense" />{expenseLabel}</span>
        </div>
      </div>

      <div
        aria-label="Tendencia de ingresos y gastos por mes"
        className={styles.chart}
        data-empty={!hasActivity}
        role="tablist"
      >
        {points.map((point, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              aria-controls={`${baseId}-detail`}
              aria-label={`${point.label}: ${incomeLabel} $${point.income}, ${expenseLabel} $${point.expense}`}
              aria-selected={isActive}
              className={styles.column}
              data-active={isActive}
              key={point.month}
              onClick={() => setSelected(index)}
              onKeyDown={move}
              role="tab"
              tabIndex={isActive ? 0 : -1}
              type="button"
              style={{
                "--income-height": `${point.incomePercent}%`,
                "--expense-height": `${point.expensePercent}%`,
              } as CSSProperties}
            >
              <span className={styles.bars}>
                <span data-kind="income" />
                <span data-kind="expense" />
              </span>
              <small>{point.label}</small>
            </button>
          );
        })}
        {!hasActivity ? <p className={styles.chartEmpty}>{emptyLabel}</p> : null}
      </div>

      <div className={styles.detail} id={`${baseId}-detail`} role="tabpanel" aria-live="polite">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            className={styles.detailInner}
            key={active?.month}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: motionDuration.micro, ease: motionCurve.exit } }}
            transition={{ duration: motionDuration.micro }}
          >
            <p className={styles.detailMonth}>{active?.label}</p>
            <div className={styles.detailRows}>
              <motion.div
                className={styles.detailRow}
                initial={reduceMotion ? false : { opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={detailTransition(motionSequence.amount)}
              >
                <span className={styles.detailKey}><i data-kind="income" />{incomeLabel}</span>
                <NumericValue prefix="$" size="sm" value={active?.income ?? "0"} />
              </motion.div>
              <motion.div
                className={styles.detailRow}
                initial={reduceMotion ? false : { opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={detailTransition(motionSequence.coverage)}
              >
                <span className={styles.detailKey}><i data-kind="expense" />{expenseLabel}</span>
                <NumericValue prefix="$" size="sm" value={active?.expense ?? "0"} />
              </motion.div>
              <Divider />
              <motion.div
                className={styles.detailRow}
                initial={reduceMotion ? false : { opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={detailTransition(motionSequence.stability)}
              >
                <span className={styles.detailKey}>{netLabel}</span>
                <NumericValue
                  prefix={active?.netPrefix ?? "$"}
                  size="sm"
                  tone={active?.netState === "negative" ? "attention" : "neutral"}
                  value={active?.net ?? "0"}
                />
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
