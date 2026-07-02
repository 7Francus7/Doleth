import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SectionTitle } from "./SectionTitle";

const meta = {
  title: "Design System/Primitives/Section Title",
  component: SectionTitle,
  args: { title: "Dónde está tu dinero" },
  parameters: { layout: "padded" },
} satisfies Meta<typeof SectionTitle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithSupport: Story = {
  args: {
    support: "line",
    supportingLine: "Distribución actual confirmada",
  },
};
export const WithAction: Story = {
  args: {
    action: "link",
    actionHref: "#",
    actionLabel: "Ver detalle",
  },
};
