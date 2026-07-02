import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./Button";

const meta = {
  title: "Design System/Primitives/Button",
  component: Button,
  args: { children: "Registrar movimiento" },
  argTypes: {
    kind: { control: "select", options: ["primary", "secondary", "ghost"] },
    size: { control: "select", options: ["md", "lg"] },
    width: { control: "select", options: ["hug", "fill"] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { kind: "secondary" } };
export const Ghost: Story = { args: { kind: "ghost" } };
export const Large: Story = { args: { size: "lg" } };
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { loading: true } };
