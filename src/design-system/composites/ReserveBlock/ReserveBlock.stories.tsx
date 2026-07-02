import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ReserveBlock } from "./ReserveBlock";

const meta = {
  title: "Design System/Composites/Reserve Block",
  component: ReserveBlock,
  args: {
    title: "Dinero reservado",
    amount: "120.000",
    amountPrefix: "$",
    purposeLine: "Separado para compromisos y objetivos activos.",
  },
  parameters: { layout: "padded" },
} satisfies Meta<typeof ReserveBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {};
export const Highlighted: Story = { args: { priority: "highlighted" } };
export const NearTarget: Story = { args: { state: "near-target" } };
export const Paused: Story = { args: { state: "paused" } };
export const Contribute: Story = {
  args: { cta: "contribute", ctaHref: "#", ctaLabel: "Aportar" },
};
export const Release: Story = {
  args: { cta: "release", ctaHref: "#", ctaLabel: "Liberar" },
};
