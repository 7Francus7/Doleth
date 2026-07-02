import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SystemRail } from "./SystemRail";

const meta = {
  title: "Design System/Composites/System Rail",
  component: SystemRail,
  args: {
    items: ["Actualizado hace 2 min", "ARS", "Personal", "Cobertura completa"],
  },
  parameters: { layout: "padded" },
  argTypes: {
    wrap: { control: "select", options: ["single-line", "truncate"] },
    state: { control: "select", options: ["complete", "partial"] },
  },
} satisfies Meta<typeof SystemRail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Complete: Story = {};
export const ThreeItems: Story = {
  args: { items: ["Hoy", "ARS", "Personal"] },
};
export const Partial: Story = {
  args: {
    items: ["Actualizado ayer", "ARS", "Personal", "Cobertura parcial"],
    state: "partial",
  },
};
export const Truncated: Story = {
  args: {
    items: ["Actualizado hace pocos minutos", "ARS", "Personal y compartido", "Cobertura completa"],
    wrap: "truncate",
  },
};
