import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CoverageMeter } from "./CoverageMeter";

const meta = {
  title: "Design System/Composites/Coverage Meter",
  component: CoverageMeter,
  args: {
    title: "Próximos 7 días",
    value: 78,
    leftSummary: "Cubierto",
    rightSummary: "$87.000 restantes",
  },
  parameters: { layout: "padded" },
  argTypes: {
    state: { control: "select", options: ["stable", "atRisk", "empty", "partial"] },
  },
} satisfies Meta<typeof CoverageMeter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Stable: Story = {};
export const AtRisk: Story = {
  args: { leftSummary: "Falta cubrir", rightSummary: "$31.000", state: "atRisk", value: 42 },
};
export const Empty: Story = {
  args: { leftSummary: "Sin compromisos cargados", rightSummary: "", state: "empty", value: 0 },
};
export const Partial: Story = {
  args: { leftSummary: "Cobertura conocida", rightSummary: "Datos parciales", state: "partial", value: 64 },
};
