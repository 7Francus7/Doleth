import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SuccessState } from "./SuccessState";

const meta = {
  title: "Design System/Feedback/Success State",
  component: SuccessState,
  parameters: { layout: "padded" },
  argTypes: { variant: { control: "select", options: ["inline", "full"] } },
} satisfies Meta<typeof SuccessState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Expense: Story = {
  args: {
    title: "Gasto registrado.",
    amount: "18.500",
    account: "Mercado Pago",
    description: "Saldos y resumen ya están actualizados.",
    primaryAction: <a href="#historial">Ver en el historial</a>,
    secondaryAction: <a href="#otro">Registrar otro</a>,
  },
};

export const Transfer: Story = {
  args: {
    title: "Transferencia completada.",
    amount: "50.000",
    account: "Banco → Efectivo",
    description: "Tu patrimonio total no cambió.",
  },
};

export const Inline: Story = {
  args: {
    variant: "inline",
    title: "Cuenta creada.",
    amount: "58.000",
    account: "Efectivo",
  },
};
