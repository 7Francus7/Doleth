import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StatusMessage } from "./StatusMessage";

const meta = {
  title: "Design System/Feedback/Status Message",
  component: StatusMessage,
  args: { tone: "success", children: "Movimiento registrado. Saldos y resumen ya están actualizados." },
  parameters: { layout: "padded" },
  argTypes: { tone: { control: "select", options: ["success", "error", "info", "warning"] } },
} satisfies Meta<typeof StatusMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {};
export const ErrorTone: Story = {
  args: { tone: "error", children: "No pudimos guardar el cambio. Revisá los datos e intentá de nuevo." },
};
export const Info: Story = {
  args: { tone: "info", children: "Este resumen consolida cuentas en ARS." },
};
export const Warning: Story = {
  args: { tone: "warning", children: "El saldo proyectado quedaría por debajo de tu mínimo." },
};
