import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BottomSheet } from "./BottomSheet";

const meta = {
  title: "Design System/Composites/Bottom Sheet",
  component: BottomSheet,
  args: {
    open: true,
    onOpenChange: () => undefined,
    title: "Disponible",
    subtitle: "Se calcula así",
    children: "Contenido del sheet",
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof BottomSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Auto: Story = {};
export const Half: Story = { args: { height: "half" } };
export const Full: Story = { args: { height: "full" } };
