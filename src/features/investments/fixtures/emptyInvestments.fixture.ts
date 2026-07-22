import type { InvestmentsViewModel } from "../model";

export const emptyInvestments: InvestmentsViewModel = {
  hasInvestments: false,
  stateText: "Registrá tu primera inversión para ver tu cartera.",
  total: { value: "0", valuePrefix: "$", label: "Valor de cartera" },
  performance: null,
  segments: [],
  holdings: [],
  stability: "Sin inversiones todavía no hay una cartera que mostrar.",
};
