import { Label } from "../../primitives/Label";
import { NumericValue } from "../../primitives/NumericValue";
import styles from "./FinancialRow.module.css";

export type FinancialRowKind = "simple" | "with-status" | "navigable";
export type FinancialRowDensity = "compact" | "regular";
export type FinancialRowState = "default" | "partial" | "attention";

interface FinancialRowBaseProps {
  label: string;
  supportingLabel?: string;
  value: string;
  valuePrefix?: string;
  valueSuffix?: string;
  density?: FinancialRowDensity;
  state?: FinancialRowState;
  className?: string;
}

interface FinancialRowSimpleProps extends FinancialRowBaseProps {
  kind?: "simple";
  status?: never;
  href?: never;
}

interface FinancialRowStatusProps extends FinancialRowBaseProps {
  kind: "with-status";
  status: string;
  href?: never;
}

interface FinancialRowNavigableProps extends FinancialRowBaseProps {
  kind: "navigable";
  status?: string;
  href: string;
}

export type FinancialRowProps =
  | FinancialRowSimpleProps
  | FinancialRowStatusProps
  | FinancialRowNavigableProps;

export function FinancialRow(props: FinancialRowProps) {
  const kind = props.kind ?? "simple";
  const density = props.density ?? "regular";
  const state = props.state ?? "default";
  const classes = [
    styles.row,
    styles[`kind-${kind}`],
    styles[`density-${density}`],
    styles[`state-${state}`],
    props.className,
  ]
    .filter(Boolean)
    .join(" ");
  const content = (
    <>
      <span className={styles.leftStack}>
        <Label size="m" tone="primary">
          {props.label}
        </Label>
        {props.supportingLabel ? (
          <Label size="s" tone="tertiary">
            {props.supportingLabel}
          </Label>
        ) : null}
        {props.status ? (
          <Label
            className={styles.status}
            size="s"
            tone={state === "attention" ? "primary" : "secondary"}
          >
            {props.status}
          </Label>
        ) : null}
      </span>
      <span className={styles.rightStack}>
        <NumericValue
          {...(props.valuePrefix !== undefined ? { prefix: props.valuePrefix } : {})}
          {...(props.valueSuffix !== undefined ? { suffix: props.valueSuffix } : {})}
          size="md"
          state={state === "partial" ? "partial" : "confirmed"}
          tone={state === "attention" ? "attention" : "neutral"}
          value={props.value}
        />
        {kind === "navigable" ? <span aria-hidden="true" className={styles.chevron} /> : null}
      </span>
    </>
  );

  if (props.kind === "navigable") {
    return (
      <a aria-label={`Ver ${props.label}`} className={classes} href={props.href}>
        {content}
      </a>
    );
  }

  return <div className={classes}>{content}</div>;
}
