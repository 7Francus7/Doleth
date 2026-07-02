import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NumericValue } from "./NumericValue";

const meta = {
  title: "Design System/Primitives/Numeric Value",
  component: NumericValue,
  args: { format: "currency", prefix: "$", value: "432.180" },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg", "xl"] },
    tone: { control: "select", options: ["neutral", "accent", "attention", "critical"] },
    format: { control: "select", options: ["currency", "percent", "plain"] },
    delta: { control: "select", options: ["none", "up", "down", "mixed"] },
    state: { control: "select", options: ["confirmed", "partial", "estimated", "unavailable"] },
  },
} satisfies Meta<typeof NumericValue>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Currency: Story = {};
export const HeroScale: Story = { args: { size: "xl" } };
export const Attention: Story = { args: { tone: "attention", value: "48.900" } };
export const Partial: Story = { args: { state: "partial" } };
export const Estimated: Story = { args: { state: "estimated" } };
export const Unavailable: Story = { args: { state: "unavailable" } };
export const WithDelta: Story = { args: { delta: "down", deltaValue: "-31.000" } };
