import type { ComponentPropsWithoutRef } from "react";
import { Label } from "../../primitives/Label";
import styles from "./CoverageMeter.module.css";

export type CoverageMeterState = "stable" | "atRisk" | "empty" | "partial";

export interface CoverageMeterProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  title: string;
  value: number;
  leftSummary: string;
  rightSummary: string;
  state?: CoverageMeterState;
  accessibleLabel?: string;
}

export function CoverageMeter({
  title,
  value,
  leftSummary,
  rightSummary,
  state = "stable",
  accessibleLabel = title,
  className,
  ...props
}: CoverageMeterProps) {
  const normalizedValue = Math.min(100, Math.max(0, value));
  const classes = [styles.meter, styles[`state-${state}`], className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} data-state={state} {...props}>
      <Label size="s" tone="secondary">
        {title}
      </Label>
      <progress aria-label={accessibleLabel} className={styles.track} max={100} value={normalizedValue} />
      <div className={styles.summary}>
        <Label className={styles.leftSummary} size="s" tone="secondary">
          {leftSummary}
        </Label>
        <Label className={styles.rightSummary} size="s" tone="primary">
          {rightSummary}
        </Label>
      </div>
    </div>
  );
}
