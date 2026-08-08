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
    { id: "1", name: "CEDEAR AAPL", kindLabel: "Acciones / CEDEARs", value: "248.000", valuePrefix: "$", invested: "205.000", deltaLabel: "+21,0%", deltaState: "positive", source: "12 × $20.666,666667 · prueba", weightLabel: "24,8% de la cartera" },
    { id: "2", name: "Bitcoin", kindLabel: "Cripto", value: "228.500", valuePrefix: "$", invested: "244.000", deltaLabel: "-6,3%", deltaState: "negative", source: "0,0025 × $91.400.000,00 · prueba", weightLabel: "22,8% de la cartera" },
    { id: "3", name: "CEDEAR SPY", kindLabel: "Acciones / CEDEARs", value: "164.000", valuePrefix: "$", invested: "150.000", deltaLabel: "+9,3%", deltaState: "positive", source: "8 × $20.500,00 · prueba", weightLabel: "16,4% de la cartera" },
    { id: "4", name: "FCI Pesos Plus", kindLabel: "Fondos (FCI)", value: "180.000", valuePrefix: "$", invested: "174.500", deltaLabel: "+3,1%", deltaState: "positive", source: "Valor que cargaste vos.", weightLabel: "18,0% de la cartera" },
    { id: "5", name: "Bono AL30", kindLabel: "Bonos", value: "112.000", valuePrefix: "$", invested: "110.500", deltaLabel: "+1,4%", deltaState: "positive", source: "Sin precio de AL30: es el último valor que cargaste.", weightLabel: "11,2% de la cartera" },
    { id: "6", name: "Caja de ahorro USD", kindLabel: "Liquidez", value: "67.000", valuePrefix: "$", invested: "67.000", deltaLabel: "0,0%", deltaState: "neutral", source: "Valor que cargaste vos.", weightLabel: "6,7% de la cartera" },
  ],
  stability: "3 tenencias se valúan contra un precio y 3 con el valor que cargaste.",
};
