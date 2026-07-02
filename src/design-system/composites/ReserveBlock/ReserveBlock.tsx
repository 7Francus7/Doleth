import { Label } from "../../primitives/Label";
import { NumericValue } from "../../primitives/NumericValue";
import { Surface } from "../../primitives/Surface";
import { TextLink } from "../../primitives/TextLink";
import styles from "./ReserveBlock.module.css";

export type ReserveBlockCta = "none" | "contribute" | "release";
export type ReserveBlockPriority = "normal" | "highlighted";
export type ReserveBlockState = "active" | "near-target" | "paused";

interface ReserveBlockBaseProps {
  title: string;
  amount: string;
  amountPrefix?: string;
  purposeLine: string;
  priority?: ReserveBlockPriority;
  state?: ReserveBlockState;
  className?: string;
}

type ReserveBlockCtaProps =
  | { cta?: "none"; ctaHref?: never; ctaLabel?: never }
  | { cta: "contribute" | "release"; ctaHref: string; ctaLabel: string };

export type ReserveBlockProps = ReserveBlockBaseProps & ReserveBlockCtaProps;

export function ReserveBlock(props: ReserveBlockProps) {
  const priority = props.priority ?? "normal";
  const state = props.state ?? "active";
  const classes = [
    styles.reserve,
    styles[`priority-${priority}`],
    styles[`state-${state}`],
    props.className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Surface
      border={priority === "highlighted" ? "default" : "subtle"}
      className={classes}
      padding="md"
      radius="lg"
      tone={priority === "highlighted" ? "subtle" : "base"}
    >
      <Label as="p" size="m" tone="secondary">
        {props.title}
      </Label>
      <NumericValue
        {...(props.amountPrefix !== undefined ? { prefix: props.amountPrefix } : {})}
        size="lg"
        state={state === "paused" ? "partial" : "confirmed"}
        value={props.amount}
      />
      <p className={styles.purpose}>{props.purposeLine}</p>
      {props.cta === "contribute" || props.cta === "release" ? (
        <TextLink href={props.ctaHref} kind="standalone" showChevron>
          {props.ctaLabel}
        </TextLink>
      ) : null}
    </Surface>
  );
}
