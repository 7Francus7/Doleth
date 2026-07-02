import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Surface } from "./Surface";

const meta = {
  title: "Design System/Primitives/Surface",
  component: Surface,
  args: {
    children: "Contenido relacionado",
    padding: "md",
  },
  argTypes: {
    tone: { control: "select", options: ["base", "raised", "subtle", "inverse"] },
    radius: { control: "select", options: ["md", "lg", "xl"] },
    border: { control: "select", options: ["none", "subtle", "default", "state"] },
    elevation: { control: "select", options: ["none", "soft", "sheet"] },
    state: { control: "select", options: ["default", "attention", "critical"] },
    padding: { control: "select", options: ["none", "sm", "md", "lg"] },
  },
  parameters: { layout: "padded" },
} satisfies Meta<typeof Surface>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Base: Story = {};
export const Raised: Story = { args: { tone: "raised", border: "subtle", elevation: "soft" } };
export const Attention: Story = { args: { border: "state", state: "attention" } };
export const Critical: Story = { args: { border: "state", state: "critical" } };
