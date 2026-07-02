import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Hero } from "./Hero";

const meta = {
  title: "Design System/Composites/Hero",
  component: Hero,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Hero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Stable: Story = {
  args: {
    scenario: "stable",
    stateText: "Hoy estás tranquilo.",
    value: "432.180",
    valuePrefix: "$",
    valueLabel: "Disponibles para usar",
    coverage: {
      title: "Próximos 7 días",
      value: 78,
      leftSummary: "Cubierto",
      rightSummary: "$87.000 restantes",
      state: "stable",
    },
  },
};

export const Attention: Story = {
  args: {
    scenario: "attention",
    stateText: "Necesita atención.",
    value: "48.900",
    valuePrefix: "$",
    valueLabel: "Disponibles hasta el viernes",
    coverage: {
      title: "Próximos 7 días",
      value: 42,
      leftSummary: "Falta cubrir",
      rightSummary: "$31.000",
      state: "atRisk",
    },
  },
};

export const AttentionRaised: Story = {
  args: { ...Attention.args, tone: "state-raised" },
};

export const Incomplete: Story = {
  args: {
    scenario: "incomplete",
    stateText: "Hace falta confirmar saldo principal",
    value: "432.180",
    valuePrefix: "$",
    valueLabel: "No confirmado",
    inlineNote: "Último valor hace 19 h",
    coverage: {
      title: "Próximos 7 días",
      value: 64,
      leftSummary: "Cobertura conocida",
      rightSummary: "Datos parciales",
      state: "partial",
    },
  },
};

export const New: Story = {
  args: {
    scenario: "new",
    stateText: "Empecemos por entender tu presente.",
    valueLabel: "Agregá tu primera cuenta para calcular tu disponible.",
  },
};
