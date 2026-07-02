import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Divider } from "./Divider";

const meta = {
  title: "Design System/Primitives/Divider",
  component: Divider,
  parameters: { layout: "padded" },
  argTypes: {
    inset: { control: "select", options: ["none", "md", "lg"] },
    tone: { control: "select", options: ["subtle", "default"] },
  },
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Full: Story = {};
export const MediumInset: Story = { args: { inset: "md" } };
export const LargeInset: Story = { args: { inset: "lg", tone: "default" } };
