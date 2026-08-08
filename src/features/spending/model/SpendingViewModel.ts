import type { InformationBlockProps } from "../../../design-system/composites/InformationBlock";
import type { StabilityStatementProps } from "../../../design-system/composites/StabilityStatement";
import type { SystemRailProps } from "../../../design-system/composites/SystemRail";

/**
 * Modelo de vista de /en-que-se-fue.
 *
 * Todo llega ya formateado: la pantalla no calcula ni redondea nada. Esa
 * separación es la que permite probar las cifras sin renderizar y evita que dos
 * componentes redondeen distinto el mismo número.
 */

/** Una fila del desglose, con su barra de participación. */
export interface SpendingRow {
  key: string;
  label: string;
  /** Importe ya formateado, sin símbolo. */
  amount: string;
  amountPrefix: string;
  /** Participación mostrada: "33 %". */
  share: string;
  /** Ancho de la barra, 0 a 100. Es la misma cifra que `share`, sin texto. */
  sharePercent: number;
  /** "12 movimientos". */
  detail: string;
  /** Cómo cambió contra el período anterior, o `null` si no hay con qué comparar. */
  delta: string | null;
  deltaDirection: "up" | "down" | "flat" | null;
  /** Ver los movimientos que componen esta fila. */
  href: string;
}

export interface SpendingBreakdown {
  id: "category" | "merchant" | "account";
  title: string;
  /** Qué responde este corte, en una línea. */
  subtitle: string;
  rows: readonly SpendingRow[];
  /** Texto del vacío propio de este corte. */
  emptyLabel: string;
}

export interface RecurringRow {
  key: string;
  label: string;
  amount: string;
  amountPrefix: string;
  /** "Todos los meses · último el 6 de agosto". */
  detail: string;
}

export interface SpendingViewModel {
  rail: Pick<SystemRailProps, "items" | "state" | "wrap">;
  /** Meses navegables, del más nuevo al más viejo. */
  months: readonly { month: string; label: string; href: string; current: boolean }[];
  headline: {
    /** La frase interpretativa que va antes del número. */
    stateText: string;
    amount: string;
    amountPrefix: string;
    label: string;
    /** Comparación con el mes anterior, o `null` si es el primer mes. */
    comparison: string | null;
    /** Promedio por día, para comparar meses de distinto largo. */
    dailyAverage: string;
  };
  breakdowns: readonly SpendingBreakdown[];
  recurring: {
    title: string;
    /** Cuánto del gasto ya está comprometido antes de empezar el mes. */
    headline: string;
    rows: readonly RecurringRow[];
    emptyLabel: string;
  };
  stability: Pick<StabilityStatementProps, "children" | "container" | "kind">;
  information: InformationBlockProps;
  /** `true` cuando no hay nada que mostrar todavía. */
  empty: boolean;
}
