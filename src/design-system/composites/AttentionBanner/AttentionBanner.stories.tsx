import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AttentionBanner } from "./AttentionBanner";

const meta = {
  title: "Design System/Composites/Attention Banner",
  component: AttentionBanner,
  args: {
    title: "Necesita atención hoy",
    detail: "Vence tu tarjeta Visa mañana y faltan $57.820.",
    actionLabel: "Resolver ahora",
  },
} satisfies Meta<typeof AttentionBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
