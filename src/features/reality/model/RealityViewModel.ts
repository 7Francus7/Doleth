import type { AttentionBannerProps } from "../../../design-system/composites/AttentionBanner";
import type { FinancialRowProps } from "../../../design-system/composites/FinancialRow";
import type { HeroProps } from "../../../design-system/composites/Hero";
import type { InformationBlockProps } from "../../../design-system/composites/InformationBlock";
import type { StabilityStatementProps } from "../../../design-system/composites/StabilityStatement";
import type { SystemRailProps } from "../../../design-system/composites/SystemRail";
import type { EvidenceBreakdown } from "../../evidence/model";

/** Sección de filas con su explicación. La explicación nunca es decorativa. */
export interface RealitySection {
  id: string;
  title: string;
  supportingLine: string;
  rows: readonly FinancialRowProps[];
  /** Cierre de la sección: qué significa lo que se acaba de leer. */
  note: string;
  noteKind?: NonNullable<StabilityStatementProps["kind"]>;
  actionLabel?: string;
  actionHref?: string;
  /** Aviso de degradación: la lectura falló y la sección lo dice. */
  notice?: string;
}

export type RealitySignalState = "met" | "missing";

export interface RealitySignalRow {
  id: string;
  label: string;
  state: RealitySignalState;
  /** Qué se verificó, con el dato real que lo sostiene. */
  reading: string;
  /** Por qué esa señal cambia lo que Doleth puede explicar. */
  matters: string;
  actionLabel?: string;
  actionHref?: string;
}

export interface RealityQuality {
  title: string;
  supportingLine: string;
  /** "Información suficiente para explicar tu situación registrada", etc. */
  stateLabel: string;
  /** Razón con denominador visible: "4 de 6 señales". Nunca un puntaje suelto. */
  ratioLabel: string;
  summary: string;
  signals: readonly RealitySignalRow[];
  /** Señales que una lectura caída impidió verificar. */
  notice?: string;
}

export interface RealityPrimaryAction {
  label: string;
  href: string;
  supportingLine: string;
}

export interface RealityViewModel {
  rail: Pick<SystemRailProps, "items" | "state" | "wrap">;
  banner: Omit<AttentionBannerProps, "className" | "onAction"> | null;
  hero: HeroProps;
  evidence: EvidenceBreakdown | null;
  /** Síntesis en una frase: de qué está compuesto el patrimonio. */
  synthesis: string;
  /** Secciones en orden de lectura: dónde está, fuera del uso, comprometido, actividad. */
  sections: readonly RealitySection[];
  stability: Pick<StabilityStatementProps, "children" | "container" | "kind">;
  primaryAction: RealityPrimaryAction | null;
  quality: RealityQuality | null;
  missing: InformationBlockProps | null;
  information: InformationBlockProps;
}
