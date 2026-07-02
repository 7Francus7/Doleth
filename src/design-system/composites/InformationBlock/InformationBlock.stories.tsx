import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { InformationBlock } from "./InformationBlock";

const meta = {
  title: "Design System/Composites/Information Block",
  component: InformationBlock,
  args: {
    title: "Cómo sabemos esto",
    primaryLine: "La información está completa.",
    causalLine: "Todos los saldos y compromisos incluidos están actualizados.",
    linkLabel: "Ver evidencia",
    linkHref: "#",
  },
  parameters: { layout: "padded" },
  argTypes: {
    state: { control: "select", options: ["complete", "partial", "stale", "conflict"] },
  },
} satisfies Meta<typeof InformationBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Complete: Story = {};
export const Partial: Story = {
  args: { primaryLine: "Parte de la información está incompleta.", state: "partial" },
};
export const Stale: Story = {
  args: { primaryLine: "Un saldo necesita actualización.", state: "stale" },
};
export const Conflict: Story = {
  args: { primaryLine: "Dos fuentes no coinciden.", state: "conflict" },
};
