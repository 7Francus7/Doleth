import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EvidenceRow } from "./EvidenceRow";

const meta = {
  title: "Design System/Composites/Evidence Row",
  component: EvidenceRow,
  args: { label: "Saldo líquido", value: "610.000", valuePrefix: "$" },
  parameters: { layout: "padded" },
  argTypes: {
    kind: { control: "select", options: ["neutral", "positive", "negative", "total"] },
  },
} satisfies Meta<typeof EvidenceRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};
export const Positive: Story = { args: { kind: "positive", sign: "+" } };
export const Negative: Story = { args: { kind: "negative", sign: "-" } };
export const Total: Story = {
  args: { kind: "total", label: "Disponible", value: "432.180" },
};
export const Collapsed: Story = {
  args: { children: "Detalle de fuentes", expandable: true },
};
export const Expanded: Story = {
  args: { children: "Detalle de fuentes", expandable: true, expanded: true },
};
