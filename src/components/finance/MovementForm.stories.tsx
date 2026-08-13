import type { ComponentType } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";
import { MovementForm } from "./MovementForm";

const accounts = [
  { id: "banco", name: "Banco principal", currency: "ARS" },
  { id: "efectivo", name: "Efectivo", currency: "ARS" },
  { id: "mp", name: "Mercado Pago", currency: "ARS" },
  { id: "usd", name: "Caja en dólares", currency: "USD" },
];
const categories = [
  { id: "food", name: "Comida", kind: "EXPENSE" }, { id: "transport", name: "Transporte", kind: "EXPENSE" },
  { id: "home", name: "Hogar", kind: "EXPENSE" }, { id: "health", name: "Salud", kind: "EXPENSE" },
  { id: "services", name: "Servicios", kind: "EXPENSE" }, { id: "leisure", name: "Ocio", kind: "EXPENSE" },
  { id: "education", name: "Educación", kind: "EXPENSE" }, { id: "other", name: "Otros", kind: "EXPENSE" },
  { id: "salary", name: "Sueldo", kind: "INCOME" }, { id: "sale", name: "Venta", kind: "INCOME" },
];
const defaults = {
  expense: { type: "EXPENSE" as const, amount: "24.300", occurredOn: "2026-07-23", sourceAccountId: "mp", categoryId: "food" },
  income: { type: "INCOME" as const, amount: "310.000", occurredOn: "2026-07-23", sourceAccountId: "banco", categoryId: "salary" },
  transfer: { type: "TRANSFER" as const, amount: "50.000", occurredOn: "2026-07-23", sourceAccountId: "banco", destinationAccountId: "efectivo" },
};

const meta = {
  title: "V2/Cut 2/Movement Form",
  component: MovementForm,
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
  args: { accounts, categories, today: "2026-07-23", idempotencyKey: "story-idempotency-key", returnTo: "/movimientos" },
} satisfies Meta<typeof MovementForm>;
export default meta;
type Story = StoryObj<typeof meta>;

const viewport = (width: number, height = 844) => {
  function ViewportStory(Story: ComponentType) {
    return <div style={{ width, minHeight: height, maxWidth: "100%", margin: "0 auto", boxSizing: "border-box", paddingInline: width < 720 ? 20 : 0 }}><Story /></div>;
  }
  return ViewportStory;
};

export const GastoMobile: Story = { args: { defaults: defaults.expense }, decorators: [viewport(390)] };
export const IngresoMobile: Story = { args: { defaults: defaults.income }, decorators: [viewport(390)] };
export const TransferenciaMobile: Story = { args: { defaults: defaults.transfer }, decorators: [viewport(390)] };
export const TransferenciaOtraMoneda: Story = { args: { defaults: { ...defaults.transfer, destinationAccountId: "usd" } }, decorators: [viewport(390)] };
export const MismaCuentaProtegida: Story = { args: { defaults: { ...defaults.transfer, destinationAccountId: "banco" } }, decorators: [viewport(390)] };
export const CuentaInvalida: Story = { args: { defaults: { ...defaults.expense, sourceAccountId: "archivada" } }, decorators: [viewport(390)] };
export const ImporteLargo: Story = { args: { defaults: { ...defaults.expense, amount: "999.999.999,99" } }, decorators: [viewport(320, 780)] };
export const ImporteCero: Story = { args: { defaults: { ...defaults.expense, amount: "0" }, previewState: { ok: false, message: "El importe tiene que ser mayor que cero.", error: { code: "money-zero", field: "amount" } } }, decorators: [viewport(320, 780)] };
export const Loading: Story = { args: { defaults: defaults.expense, previewPending: true }, decorators: [viewport(390)] };
export const ErrorCategoria: Story = { args: { defaults: { ...defaults.expense, categoryId: "" }, previewState: { ok: false, message: "Seleccioná una categoría.", error: { code: "category-required", field: "categoryId" } } }, decorators: [viewport(390)] };
export const Exito: Story = { args: { defaults: defaults.expense, previewState: { ok: true, message: "Gasto registrado", detail: "Salieron $24.300 de Mercado Pago.", data: { transactionId: "mov-1", transactionType: "EXPENSE", amount: "24.300", sourceAccountName: "Mercado Pago", redirectTo: "/movimientos" } } }, decorators: [viewport(390)] };
export const FocoTeclado: Story = { args: { initialType: "EXPENSE" }, decorators: [viewport(390, 640)] };
export const Desktop: Story = { args: { defaults: defaults.expense }, decorators: [viewport(1200, 900)] };
export const Correccion: Story = {
  args: {
    mode: "correction",
    defaults: { id: "mov-1", ...defaults.expense, amount: "18.500", occurredOn: "2026-07-21", description: "Almuerzo corregido" },
    original: { amount: "12.000", accountName: "Banco principal", occurredOn: "2026-07-20", description: "Almuerzo" },
  },
  decorators: [viewport(1200, 900)],
};
export const RepetirMovimiento: Story = { args: { basedOnPrevious: true, defaults: defaults.expense }, decorators: [viewport(390)] };
export const RepetirDesdeAnulado: Story = { args: { basedOnPrevious: true, referenceOnly: true, defaults: defaults.expense }, decorators: [viewport(390)] };

export const SelectorCategoria: Story = {
  args: { defaults: { ...defaults.expense, categoryId: "" } }, decorators: [viewport(390)],
  play: async ({ canvasElement }) => { await userEvent.click(within(canvasElement).getByRole("button", { name: /Elegir categoría/i })); },
};
export const SelectorCuenta: Story = {
  args: { defaults: { ...defaults.expense, sourceAccountId: "" } }, decorators: [viewport(390)],
  play: async ({ canvasElement }) => { await userEvent.click(within(canvasElement).getByRole("button", { name: /Elegir cuenta/i })); },
};
export const Cancelacion: Story = {
  decorators: [viewport(390)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("Importe"), "12500");
    await userEvent.click(canvas.getByRole("button", { name: "Cancelar" }));
  },
};
