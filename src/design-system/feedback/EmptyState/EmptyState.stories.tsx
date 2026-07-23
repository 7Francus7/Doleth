import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EmptyState } from "./EmptyState";

const meta = {
  title: "Design System/Feedback/Empty State",
  component: EmptyState,
  parameters: { layout: "padded" },
  argTypes: { variant: { control: "select", options: ["full", "compact"] } },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

const link = <a href="#nuevo">Crear primera cuenta</a>;

export const WithAction: Story = {
  args: {
    title: "Empezá por representar dónde está tu dinero.",
    description: "Podés agregar efectivo, banco, billetera virtual u otra cuenta.",
    primaryAction: link,
  },
};

export const WithoutAction: Story = {
  args: {
    title: "Todavía no hay suficiente historia para comparar.",
    description: "Cuando existan movimientos en distintos momentos, Doleth podrá explicar qué cambió.",
  },
};

export const Compact: Story = {
  args: {
    variant: "compact",
    title: "No encontramos movimientos con estos filtros.",
    description: "Probá con otro mes, tipo o cuenta.",
    primaryAction: <a href="#reset">Limpiar filtros</a>,
  },
};
