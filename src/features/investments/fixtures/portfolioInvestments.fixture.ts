import type { InvestmentsViewModel } from "../model";

export const portfolioInvestments: InvestmentsViewModel = {
  hasInvestments: true,
  stateText: "Tu cartera está por encima de lo aportado.",
  total: { value: "999.500", valuePrefix: "$", label: "Valor de cartera" },
  performance: {
    invested: "870.000",
    gain: "129.500",
    gainPrefix: "+$",
    gainPercentLabel: "+14,9%",
    state: "positive",
  },
  segments: [
    { id: "STOCKS", label: "Acciones / CEDEARs", value: "412.000", valuePrefix: "$", allocationPercent: 41.2, deltaLabel: "+18,2%", deltaState: "positive" },
    { id: "CRYPTO", label: "Cripto", value: "228.500", valuePrefix: "$", allocationPercent: 22.9, deltaLabel: "-6,3%", deltaState: "negative" },
    { id: "FUND", label: "Fondos (FCI)", value: "180.000", valuePrefix: "$", allocationPercent: 18.0, deltaLabel: "+3,1%", deltaState: "positive" },
    { id: "BOND", label: "Bonos", value: "112.000", valuePrefix: "$", allocationPercent: 11.2, deltaLabel: "+1,4%", deltaState: "positive" },
    { id: "CASH_EQUIVALENT", label: "Liquidez", value: "67.000", valuePrefix: "$", allocationPercent: 6.7, deltaLabel: "0,0%", deltaState: "neutral" },
  ],
  holdings: [
    { id: "1", name: "CEDEAR AAPL", kindLabel: "Acciones / CEDEARs", value: "248.000", valuePrefix: "$", invested: "205.000", deltaLabel: "+21,0%", deltaState: "positive" },
    { id: "2", name: "Bitcoin", kindLabel: "Cripto", value: "228.500", valuePrefix: "$", invested: "244.000", deltaLabel: "-6,3%", deltaState: "negative" },
    { id: "3", name: "CEDEAR SPY", kindLabel: "Acciones / CEDEARs", value: "164.000", valuePrefix: "$", invested: "150.000", deltaLabel: "+9,3%", deltaState: "positive" },
    { id: "4", name: "FCI Pesos Plus", kindLabel: "Fondos (FCI)", value: "180.000", valuePrefix: "$", invested: "174.500", deltaLabel: "+3,1%", deltaState: "positive" },
    { id: "5", name: "Bono AL30", kindLabel: "Bonos", value: "112.000", valuePrefix: "$", invested: "110.500", deltaLabel: "+1,4%", deltaState: "positive" },
    { id: "6", name: "Caja de ahorro USD", kindLabel: "Liquidez", value: "67.000", valuePrefix: "$", invested: "67.000", deltaLabel: "0,0%", deltaState: "neutral" },
  ],
  stability: "Los valores son los que cargaste manualmente; Doleth no estima cotizaciones.",
};
