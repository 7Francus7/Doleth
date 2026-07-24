import type { ActionStripProps } from "../../../design-system/composites/ActionStrip";
import type { AttentionBannerProps } from "../../../design-system/composites/AttentionBanner";
import type { FinancialRowProps } from "../../../design-system/composites/FinancialRow";
import type { HeroProps } from "../../../design-system/composites/Hero";
import type { InformationBlockProps } from "../../../design-system/composites/InformationBlock";
import type { StabilityStatementProps } from "../../../design-system/composites/StabilityStatement";
import type { SystemRailProps } from "../../../design-system/composites/SystemRail";
import type { EvidenceBreakdown } from "../../evidence/model";

/**
 * Bloque de proyección: la respuesta a "¿con cuánto quedaría?".
 * Nunca se presenta como saldo garantizado: siempre viaja con su fórmula, su
 * horizonte y lo que quedó afuera.
 */
export interface NowProjection {
  title: string;
  /** "Después de los pagos cargados quedarían aproximadamente $332.500." */
  headline: string;
  amount: string;
  amountPrefix: string;
  amountState: "default" | "attention";
  /** Dinero en cuentas → comprometido → quedarían. La resta se puede seguir. */
  rows: readonly FinancialRowProps[];
  /** Horizonte y cantidad de pagos incluidos. */
  note: string;
  /** Compromisos que existen pero quedaron fuera del horizonte. */
  excludedNote?: string;
  linkLabel: string;
  linkHref: string;
}

export interface NowViewModel {
  rail: Pick<SystemRailProps, "items" | "state" | "wrap">;
  banner: Omit<AttentionBannerProps, "className" | "onAction"> | null;
  hero: HeroProps;
  evidence: EvidenceBreakdown | null;
  projection: NowProjection | null;
  stability: Pick<StabilityStatementProps, "children" | "container" | "kind">;
  actions: Omit<ActionStripProps, "className" | "onAction">;
  position: {
    title: string;
    rows: readonly FinancialRowProps[];
  };
  accounts?: readonly {
    id: string;
    name: string;
    type: string;
    balance: string;
    balancePrefix: string;
    state: "stable" | "attention";
  }[];
  operational?: readonly {
    title: string;
    actionLabel: string;
    actionHref: string;
    rows: readonly FinancialRowProps[];
    /** Aviso cuando esta sección secundaria no pudo cargar. */
    notice?: string;
  }[];
  investments?: {
    hasInvestments: boolean;
    value: string;
    valuePrefix: string;
    deltaLabel: string;
    deltaState: "positive" | "negative" | "neutral";
    href: string;
  } | null;
  information: InformationBlockProps;
}
