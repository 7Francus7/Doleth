import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ActionStrip } from "./ActionStrip";

const meta = {
  title: "Design System/Composites/Action Strip",
  component: ActionStrip,
  args: {
    primary: "register",
    primaryLabel: "Registrar movimiento",
    secondaryActions: [
      { id: "pay", label: "Pagar" },
      { id: "move", label: "Mover" },
      { id: "update", label: "Actualizar" },
      { id: "evidence", label: "Evidencia" },
    ],
  },
  parameters: { layout: "padded" },
} satisfies Meta<typeof ActionStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Reduced: Story = {
  args: {
    primary: "update",
    primaryLabel: "Actualizar información",
    secondaryActions: [
      { id: "register", label: "Registrar" },
      { id: "evidence", label: "Evidencia" },
    ],
    state: "reduced",
  },
};
