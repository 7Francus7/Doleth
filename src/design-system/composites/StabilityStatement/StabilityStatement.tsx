import type { ComponentPropsWithoutRef } from "react";
import { Surface } from "../../primitives/Surface";
import styles from "./StabilityStatement.module.css";

export type StabilityStatementKind = "neutral" | "stable" | "attention" | "caution";
export type StabilityStatementContainer = "none" | "subtle";

export interface StabilityStatementProps extends ComponentPropsWithoutRef<"p"> {
  kind?: StabilityStatementKind;
  container?: StabilityStatementContainer;
}

export function StabilityStatement({
  kind = "neutral",
  container = "none",
  className,
  ...props
}: StabilityStatementProps) {
  const statementClasses = [styles.statement, styles[`kind-${kind}`], className]
    .filter(Boolean)
    .join(" ");
  const statement = <p className={statementClasses} {...props} />;

  if (container === "subtle") {
    return (
      <Surface padding="sm" radius="md" tone="subtle">
        {statement}
      </Surface>
    );
  }

  return statement;
}
