import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MovementForm } from "./MovementForm";

const accounts = [
  { id: "banco", name: "Banco", currency: "ARS" },
  { id: "efectivo", name: "Efectivo", currency: "ARS" },
  { id: "mp", name: "Mercado Pago", currency: "ARS" },
];

const categories = [
  { id: "food", name: "Comida", kind: "EXPENSE" },
  { id: "transport", name: "Transporte", kind: "EXPENSE" },
  { id: "salary", name: "Sueldo", kind: "INCOME" },
];

const meta = {
  title: "App/MovementForm",
  component: MovementForm,
  parameters: { layout: "padded", nextjs: { appDirectory: true } },
  args: {
    accounts,
    categories,
    today: "2026-07-23",
    idempotencyKey: "story-idempotency-key",
    returnTo: "/movimientos",
  },
} satisfies Meta<typeof MovementForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Gasto: importe primero, cuenta, categoría, fecha. */
export const Gasto: Story = {};

/** Ingreso ya cargado. */
export const Ingreso: Story = {
  args: {
    defaults: {
      type: "INCOME",
      amount: "80.000",
      occurredOn: "2026-07-23",
      sourceAccountId: "banco",
      categoryId: "salary",
    },
  },
};

/** Transferencia: muestra de dónde sale, dónde entra y que el patrimonio no cambia. */
export const Transferencia: Story = {
  args: {
    defaults: {
      type: "TRANSFER",
      amount: "50.000",
      occurredOn: "2026-07-23",
      sourceAccountId: "banco",
      destinationAccountId: "efectivo",
    },
  },
};

/** Corrección: anuncia la trazabilidad y compara valor anterior contra nuevo. */
export const Correccion: Story = {
  args: {
    mode: "correction",
    defaults: {
      id: "mov-1",
      type: "EXPENSE",
      amount: "18.500",
      occurredOn: "2026-07-21",
      sourceAccountId: "mp",
      categoryId: "food",
      description: "Almuerzo",
    },
    original: {
      amount: "12.000",
      accountName: "Banco",
      occurredOn: "2026-07-20",
      description: "Almuerzo",
    },
  },
};

/** Repetido desde un movimiento anterior, con fecha de hoy. */
export const RepetirMovimiento: Story = {
  args: {
    basedOnPrevious: true,
    defaults: {
      type: "EXPENSE",
      amount: "18.500",
      occurredOn: "2026-07-23",
      sourceAccountId: "mp",
      categoryId: "food",
      description: "Almuerzo",
    },
  },
};

/** Basado en un movimiento anulado: sirve de referencia y se dice explícitamente. */
export const RepetirDesdeAnulado: Story = {
  args: {
    basedOnPrevious: true,
    referenceOnly: true,
    defaults: {
      type: "EXPENSE",
      amount: "18.500",
      occurredOn: "2026-07-23",
      sourceAccountId: "mp",
      categoryId: "food",
    },
  },
};

/** Ancho de teléfono chico, con el footer de acciones fijo. */
export const Mobile320: Story = {
  globals: { viewport: { value: "mobile1" } },
};
