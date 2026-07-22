import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AllocationChart, type AllocationSegment } from "./AllocationChart";

const segments: readonly AllocationSegment[] = [
  { id: "cedears", label: "CEDEARs", value: "412.000", allocationPercent: 41.2, deltaLabel: "+14,8%", deltaState: "positive" },
  { id: "crypto", label: "Cripto", value: "228.500", allocationPercent: 22.9, deltaLabel: "-6,3%", deltaState: "negative" },
  { id: "fci", label: "Fondos (FCI)", value: "180.000", allocationPercent: 18.0, deltaLabel: "+3,1%", deltaState: "positive" },
  { id: "bonds", label: "Bonos", value: "112.000", allocationPercent: 11.2, deltaLabel: "+1,4%", deltaState: "positive" },
  { id: "cash", label: "Liquidez", value: "67.000", allocationPercent: 6.7, deltaLabel: "0,0%", deltaState: "neutral" },
];

const meta = {
  title: "Design System/Composites/Allocation Chart",
  component: AllocationChart,
  parameters: { layout: "padded" },
} satisfies Meta<typeof AllocationChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Portfolio: Story = {
  args: { segments, total: "999.500", totalLabel: "Valor total" },
};

export const Single: Story = {
  args: {
    segments: [{ id: "cedears", label: "CEDEARs", value: "412.000", allocationPercent: 100, deltaLabel: "+14,8%", deltaState: "positive" }],
    total: "412.000",
  },
};

export const Empty: Story = {
  args: { segments: [], total: "0" },
};
