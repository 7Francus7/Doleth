import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StabilityStatement } from "./StabilityStatement";

const meta = {
  title: "Design System/Composites/Stability Statement",
  component: StabilityStatement,
  args: { children: "No hay riesgos inmediatos." },
  parameters: { layout: "padded" },
  argTypes: {
    kind: { control: "select", options: ["neutral", "stable", "attention", "caution"] },
    container: { control: "select", options: ["none", "subtle"] },
  },
} satisfies Meta<typeof StabilityStatement>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};
export const Stable: Story = {
  args: { children: "Tus reservas cubren el próximo mes.", kind: "stable" },
};
export const Attention: Story = {
  args: { children: "El viernes vence tu mayor compromiso.", kind: "attention" },
};
export const Caution: Story = {
  args: { children: "Conviene revisar el saldo principal.", kind: "caution" },
};
export const SubtleContainer: Story = {
  args: { container: "subtle" },
};
