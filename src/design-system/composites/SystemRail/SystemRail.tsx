import type { ComponentPropsWithoutRef } from "react";
import { Label } from "../../primitives/Label";
import styles from "./SystemRail.module.css";

export type SystemRailItems =
  | readonly [string, string, string]
  | readonly [string, string, string, string];
export type SystemRailWrap = "single-line" | "truncate";
export type SystemRailState = "complete" | "partial";

export interface SystemRailProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  items: SystemRailItems;
  wrap?: SystemRailWrap;
  state?: SystemRailState;
}

export function SystemRail({
  items,
  wrap = "single-line",
  state = "complete",
  className,
  ...props
}: SystemRailProps) {
  const classes = [styles.rail, styles[`wrap-${wrap}`], styles[`state-${state}`], className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} data-state={state} {...props}>
      {items.map((item, index) => (
        <span className={styles.unit} key={`${item}-${index}`}>
          {index > 0 ? <span aria-hidden="true" className={styles.separator} /> : null}
          <Label className={styles.item} size="s" tone="tertiary">
            {item}
          </Label>
        </span>
      ))}
    </div>
  );
}
