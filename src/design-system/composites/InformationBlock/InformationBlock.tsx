import { Label } from "../../primitives/Label";
import { Surface } from "../../primitives/Surface";
import { TextLink } from "../../primitives/TextLink";
import styles from "./InformationBlock.module.css";

export type InformationBlockState = "complete" | "partial" | "stale" | "conflict";

export interface InformationBlockProps {
  title: string;
  primaryLine: string;
  causalLine: string;
  linkLabel: string;
  linkHref: string;
  state?: InformationBlockState;
  className?: string;
}

export function InformationBlock({
  title,
  primaryLine,
  causalLine,
  linkLabel,
  linkHref,
  state = "complete",
  className,
}: InformationBlockProps) {
  const classes = [styles.block, styles[`state-${state}`], className]
    .filter(Boolean)
    .join(" ");

  return (
    <Surface
      border={state === "complete" ? "subtle" : "state"}
      className={classes}
      padding="md"
      radius="lg"
      state={state === "conflict" ? "critical" : state === "complete" ? "default" : "attention"}
      tone="subtle"
    >
      <Label as="p" size="m" tone="primary">
        {title}
      </Label>
      <p className={styles.primaryLine}>{primaryLine}</p>
      <p className={styles.causalLine}>{causalLine}</p>
      <TextLink href={linkHref} kind="standalone" showChevron>
        {linkLabel}
      </TextLink>
    </Surface>
  );
}
