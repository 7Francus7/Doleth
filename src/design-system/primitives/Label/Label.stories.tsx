import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Label } from "./Label";

const meta = {
  title: "Design System/Primitives/Label",
  component: Label,
  args: { children: "Disponible para usar" },
  argTypes: {
    as: { control: "select", options: ["span", "label", "p"] },
    size: { control: "select", options: ["s", "m", "l"] },
    tone: { control: "select", options: ["primary", "secondary", "tertiary"] },
    textCase: { control: "select", options: ["sentence", "uppercase"] },
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Medium: Story = {};
export const SmallUppercase: Story = { args: { size: "s", textCase: "uppercase" } };
export const LargePrimary: Story = { args: { size: "l", tone: "primary" } };
export const Tertiary: Story = { args: { tone: "tertiary" } };
