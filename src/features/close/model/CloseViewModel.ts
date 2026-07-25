import type { FinancialRowProps } from "../../../design-system/composites/FinancialRow";
import type { InformationBlockProps } from "../../../design-system/composites/InformationBlock";
import type { StabilityStatementProps } from "../../../design-system/composites/StabilityStatement";
import type { SystemRailProps } from "../../../design-system/composites/SystemRail";

/** Una opción de período. Solo mes en curso y mes anterior en este corte. */
export interface ClosePeriodOption {
  month: string;
  label: string;
  detail: string;
  href: string;
  selected: boolean;
}

export interface CloseBlock {
  id: string;
  title: string;
  supportingLine: string;
  rows: readonly FinancialRowProps[];
  note: string;
  noteKind?: NonNullable<StabilityStatementProps["kind"]>;
  actionLabel?: string;
  actionHref?: string;
  /** Aviso de degradación o de alcance. Se anuncia, no se esconde. */
  notice?: string;
}

export type CloseWarningSeverity = "review" | "info";

export interface CloseWarningRow {
  id: string;
  label: string;
  detail: string;
  severity: CloseWarningSeverity;
  actionLabel?: string;
  actionHref?: string;
}

export interface CloseNav {
  backHref: string | null;
  backLabel: string | null;
  nextHref: string | null;
  nextLabel: string | null;
}

export interface CloseSummaryAction {
  id: string;
  label: string;
  href: string;
}

export interface CloseSummary {
  title: string;
  /** Se dice qué se calculó, nunca que quedó guardado. */
  statement: string;
  rows: readonly FinancialRowProps[];
  actions: readonly CloseSummaryAction[];
}

export interface CloseViewModel {
  rail: Pick<SystemRailProps, "items" | "state" | "wrap">;
  /** "Paso 2 de 7": progreso textual, sin stepper visual apretado. */
  progressLabel: string;
  stepNumber: number;
  stepCount: number;
  title: string;
  supportingLine: string;
  intro: string;
  /** Solo en el paso de período. */
  periods: readonly ClosePeriodOption[] | null;
  blocks: readonly CloseBlock[];
  warnings: readonly CloseWarningRow[];
  /** Aviso general del paso: qué no se pudo leer o qué alcance tiene. */
  notice: string | null;
  summary: CloseSummary | null;
  nav: CloseNav;
  information: InformationBlockProps;
  /** Sin cuentas no hay período que revisar. */
  empty: {
    title: string;
    description: string;
    actionLabel: string;
    actionHref: string;
  } | null;
}
