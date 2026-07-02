import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FinancialRow } from "./FinancialRow";

const meta = {
  title: "Design System/Composites/Financial Row",
  component: FinancialRow,
  args: { label: "Líquido", value: "610.000", valuePrefix: "$" },
  parameters: { layout: "padded" },
} satisfies Meta<typeof FinancialRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Simple: Story = {};
export const Compact: Story = { args: { density: "compact" } };
export const WithStatus: Story = {
  args: { kind: "with-status", status: "Confirmado hoy" },
};
export const Navigable: Story = {
  args: { href: "#", kind: "navigable" },
};
export const Partial: Story = { args: { state: "partial" } };
export const Attention: Story = { args: { state: "attention" } };
