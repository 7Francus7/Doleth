import type { ReactNode } from "react";
import { Label } from "../../primitives/Label";
import { NumericValue } from "../../primitives/NumericValue";
import styles from "./EvidenceRow.module.css";

export type EvidenceRowKind = "neutral" | "positive" | "negative" | "total";

export interface EvidenceRowProps {
  label: string;
  value: string;
  valuePrefix?: string;
  sign?: "+" | "-";
  kind?: EvidenceRowKind;
  expandable?: boolean;
  expanded?: boolean;
  children?: ReactNode;
  className?: string;
}

function EvidenceRowContent({
  label,
  value,
  valuePrefix,
  sign,
  kind = "neutral",
  expandable = false,
}: Omit<EvidenceRowProps, "children" | "className" | "expanded">) {
  const prefix = `${sign ?? ""}${valuePrefix ?? ""}`;

  return (
    <span className={styles.content}>
      <Label size={kind === "total" ? "l" : "m"} tone="primary">
        {label}
      </Label>
      <span className={styles.valueStack}>
        <NumericValue
          {...(prefix ? { prefix } : {})}
          size={kind === "total" ? "lg" : "md"}
          value={value}
        />
        {expandable ? <span aria-hidden="true" className={styles.chevron} /> : null}
      </span>
    </span>
  );
}

export function EvidenceRow({
  expandable = false,
  expanded = false,
  children,
  className,
  ...props
}: EvidenceRowProps) {
  const kind = props.kind ?? "neutral";
  const classes = [styles.row, styles[`kind-${kind}`], className]
    .filter(Boolean)
    .join(" ");

  if (expandable) {
    return (
      <details className={classes} open={expanded}>
        <summary className={styles.summary}>
          <EvidenceRowContent {...props} expandable />
        </summary>
        {children ? <div className={styles.expandedContent}>{children}</div> : null}
      </details>
    );
  }

  return (
    <div className={classes}>
      <EvidenceRowContent {...props} />
    </div>
  );
}
