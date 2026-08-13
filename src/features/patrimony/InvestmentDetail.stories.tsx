import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { InvestmentDetail } from "./InvestmentDetail";
import { buildInvestmentDetailModel, type PatrimonyInvestmentInput } from "./model";

const data = (overrides: Partial<PatrimonyInvestmentInput> = {}): PatrimonyInvestmentInput => ({ id: "apple", name: "Apple CEDEAR", kind: "STOCKS", symbol: "AAPL", currency: "ARS", investedCents: 400_000_00n, valueCents: 520_000_00n, convertedInvestedCents: 400_000_00n, convertedValueCents: 520_000_00n, quantity: "10", note: "Largo plazo", status: "ACTIVE", mode: "market", priceProvider: "BYMA", priceAsOf: "2026-08-13", ...overrides });
const meta = { title: "V2/Cut 6/Investment detail", component: InvestmentDetail, parameters: { layout: "fullscreen", nextjs: { appDirectory: true } }, args: { model: buildInvestmentDetailModel(data()) } } satisfies Meta<typeof InvestmentDetail>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Ganancia: Story = {};
export const Perdida: Story = { args: { model: buildInvestmentDetailModel(data({ investedCents: 600_000_00n })) } };
export const Manual: Story = { args: { model: buildInvestmentDetailModel(data({ symbol: null, quantity: null, mode: "declared", priceProvider: null, priceAsOf: null })) } };
export const AporteCero: Story = { args: { model: buildInvestmentDetailModel(data({ investedCents: 0n })) } };
export const Archivada: Story = { args: { model: buildInvestmentDetailModel(data({ status: "ARCHIVED" })) } };
