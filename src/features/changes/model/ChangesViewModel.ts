import type { ActionStripProps } from "../../../design-system/composites/ActionStrip";
import type { AttentionBannerProps } from "../../../design-system/composites/AttentionBanner";
import type { FinancialRowProps } from "../../../design-system/composites/FinancialRow";
import type { HeroProps } from "../../../design-system/composites/Hero";
import type { InformationBlockProps } from "../../../design-system/composites/InformationBlock";
import type { StabilityStatementProps } from "../../../design-system/composites/StabilityStatement";
import type { SystemRailProps } from "../../../design-system/composites/SystemRail";
import type { EvidenceBreakdown } from "../../evidence/model";

/** Una causa del cambio: categoría agrupada o el resto reunido en "Otros". */
export interface ChangeCauseRow {
  id: string;
  label: string;
  /** Participación y cantidad de movimientos, con su denominador dicho. */
  supportingLabel: string;
  value: string;
  valuePrefix: string;
  direction: "in" | "out";
  /** Destaca solo lo que supera el umbral de materialidad declarado. */
  material: boolean;
  /** Detalle navegable interno. Ausente en "Otros": no tiene un filtro propio. */
  href?: string;
}

export interface ChangesViewModel {
  rail: Pick<SystemRailProps, "items" | "state" | "wrap">;
  banner: Omit<AttentionBannerProps, "className" | "onAction"> | null;
  hero: HeroProps;
  /** `null` cuando el desglose no pudo leerse: el total sigue siendo verdadero. */
  evidence: EvidenceBreakdown | null;
  comparison: {
    title: string;
    supportingLine: string;
    rows: readonly FinancialRowProps[];
    summary: string;
    summaryKind: NonNullable<StabilityStatementProps["kind"]>;
  };
  causes: {
    title: string;
    supportingLine: string;
    rows: readonly ChangeCauseRow[];
    /** Qué quedó agrupado y por qué la suma sigue cerrando. */
    note: string;
  } | null;
  /** Movimientos entre cuentas propias: nunca son causa patrimonial. */
  transfers: { line: string } | null;
  /** Degradación declarada cuando falta una lectura secundaria. */
  notice: string | null;
  stability: Pick<StabilityStatementProps, "children" | "container" | "kind">;
  actions: Omit<ActionStripProps, "className" | "onAction"> | null;
  missing: InformationBlockProps | null;
  information: InformationBlockProps;
}
