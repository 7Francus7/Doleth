import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PatrimonyPage } from "./PatrimonyPage";
import { buildPatrimonyModel, type PatrimonyAccountInput, type PatrimonyInvestmentInput } from "./model";

const account = (id: string, overrides: Partial<PatrimonyAccountInput> = {}): PatrimonyAccountInput => ({ id, name: id, type: "BANK", currency: "ARS", status: "ACTIVE", liability: false, originalCents: 1_248_300_00n, valuedCents: 1_248_300_00n, ...overrides });
const investment = (id: string, overrides: Partial<PatrimonyInvestmentInput> = {}): PatrimonyInvestmentInput => ({ id, name: "Apple CEDEAR", kind: "STOCKS", symbol: "AAPL", currency: "ARS", investedCents: 400_000_00n, valueCents: 520_000_00n, convertedInvestedCents: 400_000_00n, convertedValueCents: 520_000_00n, quantity: "10", note: "Largo plazo", status: "ACTIVE", mode: "market", priceProvider: "BYMA", priceAsOf: "2026-08-13", ...overrides });
const accounts = [account("Banco principal"), account("Ahorro", { type: "SAVINGS", originalCents: 800_000_00n, valuedCents: 800_000_00n }), account("Visa", { type: "CREDIT_CARD", liability: true, originalCents: -310_500_00n, valuedCents: -310_500_00n })];
const investments = [investment("apple"), investment("fci", { name: "Fondo money market", kind: "FUND", symbol: null, quantity: null, investedCents: 250_000_00n, valueCents: 246_000_00n, convertedInvestedCents: 250_000_00n, convertedValueCents: 246_000_00n, mode: "declared", priceProvider: null, priceAsOf: null })];
const make = (items = investments, overrides: Record<string, unknown> = {}) => buildPatrimonyModel({ displayCurrency: "ARS", displaySymbol: "$", accountsComplete: true, investmentsComplete: true, investedBasisComplete: true, accounts, investments: items, ...overrides });

const meta = { title: "V2/Cut 6/Patrimony", component: PatrimonyPage, parameters: { layout: "fullscreen", nextjs: { appDirectory: true } }, args: { model: make() } } satisfies Meta<typeof PatrimonyPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Muchas: Story = {};
export const SinInversiones: Story = { args: { model: make([]) } };
export const UnaInversion: Story = { args: { model: make([investments[0]!]) } };
export const Ganancia: Story = { args: { model: make([investment("gain")]) } };
export const Perdida: Story = { args: { model: make([investment("loss", { investedCents: 600_000_00n, convertedInvestedCents: 600_000_00n })]) } };
export const ValorManual: Story = { args: { model: make([investments[1]!]) } };
export const SinCotizacion: Story = { args: { model: make([investment("missing", { mode: "declared", priceProvider: null, priceAsOf: null })], { investmentsComplete: false, investmentValuationNote: "Falta una cotización. Se muestran importes nativos sin sumarlos." }) } };
export const Multimoneda: Story = { args: { model: make([investment("ars"), investment("usd", { name: "ETF global", symbol: "VT", currency: "USD", investedCents: 900_00n, valueCents: 1_020_00n, convertedInvestedCents: 1_350_000_00n, convertedValueCents: 1_530_000_00n })]) } };
export const AporteCero: Story = { args: { model: make([investment("zero", { investedCents: 0n, convertedInvestedCents: 0n })]) } };
export const ImporteExtremo: Story = { args: { model: make([investment("extreme", { valueCents: 98_765_432_109_87n, convertedValueCents: 98_765_432_109_87n })]) } };
export const Archivada: Story = { args: { model: make([investment("old", { status: "ARCHIVED" })]) } };
