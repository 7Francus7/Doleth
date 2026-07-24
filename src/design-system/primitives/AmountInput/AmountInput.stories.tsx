import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { AmountInput } from "./AmountInput";

function Controlled({ initial, ...props }: { initial: string } & Partial<Parameters<typeof AmountInput>[0]>) {
  const [value, setValue] = useState(initial);
  return <AmountInput name="amount" onValueChange={setValue} value={value} {...props} />;
}

const meta = {
  title: "Design System/Primitives/AmountInput",
  component: Controlled,
  args: { initial: "" },
} satisfies Meta<typeof Controlled>;

export default meta;
type Story = StoryObj<typeof meta>;

/** En reposo: sin cero impuesto, con ayuda sobre los formatos aceptados. */
export const Vacio: Story = {
  args: { initial: "", hint: "Podés escribirlo como 12.500 o 12500." },
};

/** Importe cotidiano ya formateado en lectura argentina. */
export const ConImporte: Story = { args: { initial: "18.500" } };

/** Importe grande: los separadores de miles evitan el desborde visual. */
export const ImporteGrande: Story = { args: { initial: "1.500.000,75" } };

/** Error del servidor asociado al campo. */
export const ConError: Story = {
  args: { initial: "abc", error: "Ese importe no se entiende. Probá con números, por ejemplo 12.500." },
};

/** Ancho de teléfono chico. */
export const Mobile320: Story = {
  args: { initial: "12.500" },
  globals: { viewport: { value: "mobile1" } },
};
