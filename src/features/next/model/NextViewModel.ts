import type { ActionStripProps } from "../../../design-system/composites/ActionStrip";
import type { AttentionBannerProps } from "../../../design-system/composites/AttentionBanner";
import type { CoverageMeterProps } from "../../../design-system/composites/CoverageMeter";
import type { FinancialRowProps } from "../../../design-system/composites/FinancialRow";
import type { HeroProps } from "../../../design-system/composites/Hero";
import type { InformationBlockProps } from "../../../design-system/composites/InformationBlock";
import type { StabilityStatementProps } from "../../../design-system/composites/StabilityStatement";
import type { SystemRailProps } from "../../../design-system/composites/SystemRail";
import type { EvidenceBreakdown } from "../../evidence/model";

/** Estado de un pago tal como el dominio lo puede sostener hoy. */
export type NextPaymentState = "overdue" | "due-today" | "pending";

export interface NextPayment {
  id: string;
  concept: string;
  href: string;
  amount: string;
  amountPrefix: string;
  /** "Hoy" · "Mañana" · "Viernes 31 de julio". */
  dateLabel: string;
  accountName: string;
  state: NextPaymentState;
  /** Texto del estado: nunca solo color. */
  stateLabel: string;
  /** "Después de este pago quedarían aproximadamente $214.300." */
  balanceAfterLabel: string;
  balanceAfterState: "default" | "attention";
}

export interface NextTimelineGroup {
  id: string;
  title: string;
  /** "3 pagos · $46.000". */
  summary: string;
  tone: "overdue" | "today" | "normal";
  payments: readonly NextPayment[];
  /** Saldo tras el último pago del tramo. */
  balanceAfterLabel: string;
}

export interface NextCoverage {
  /** "Tenés cubiertos $80.000 de $96.000." */
  headline: string;
  /** "Faltan $16.000 para cubrir los pagos cargados." */
  detail: string;
  meter: CoverageMeterProps;
  /** Aclaración sobre importes previstos, cuando corresponde. */
  note?: string;
}

export interface NextEmptyState {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}

export interface NextViewModel {
  rail: Pick<SystemRailProps, "items" | "state" | "wrap">;
  banner: Omit<AttentionBannerProps, "className" | "onAction"> | null;
  hero: HeroProps;
  evidence: EvidenceBreakdown | null;
  coverage: NextCoverage | null;
  stability: Pick<StabilityStatementProps, "children" | "container" | "kind">;
  actions: Omit<ActionStripProps, "className" | "onAction"> | null;
  /** Tramos con pagos. Un tramo vacío nunca se muestra. */
  timeline: readonly NextTimelineGroup[];
  empty: NextEmptyState | null;
  confirmed: {
    title: string;
    caption: string;
    rows: readonly FinancialRowProps[];
  } | null;
  information: InformationBlockProps;
  /** Clave de restauración de scroll de la lista, normalizada por URL. */
  restorationKey: string;
}
