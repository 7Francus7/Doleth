import { TextLink } from "../TextLink";
import styles from "./SectionTitle.module.css";

export type SectionTitleSupport = "none" | "line";
export type SectionTitleAction = "none" | "link";

interface SectionTitleBaseProps {
  title: string;
  className?: string;
}

type SectionTitleSupportProps =
  | { support?: "none"; supportingLine?: never }
  | { support: "line"; supportingLine: string };

type SectionTitleActionProps =
  | { action?: "none"; actionHref?: never; actionLabel?: never }
  | { action: "link"; actionHref: string; actionLabel: string };

export type SectionTitleProps = SectionTitleBaseProps &
  SectionTitleSupportProps &
  SectionTitleActionProps;

export function SectionTitle(props: SectionTitleProps) {
  const classes = [styles.sectionTitle, props.className].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      <div className={styles.copy}>
        <h2 className={styles.title}>{props.title}</h2>
        {props.support === "line" ? (
          <p className={styles.support}>{props.supportingLine}</p>
        ) : null}
      </div>
      {props.action === "link" ? (
        <TextLink href={props.actionHref} kind="standalone" showChevron>
          {props.actionLabel}
        </TextLink>
      ) : null}
    </div>
  );
}
