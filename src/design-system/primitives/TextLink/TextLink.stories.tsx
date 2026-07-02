import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TextLink } from "./TextLink";

const meta = {
  title: "Design System/Primitives/Text Link",
  component: TextLink,
  args: { children: "Ver evidencia", href: "#" },
  argTypes: {
    kind: { control: "select", options: ["inline", "standalone"] },
  },
} satisfies Meta<typeof TextLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Inline: Story = {};
export const Standalone: Story = { args: { kind: "standalone" } };
export const WithChevron: Story = { args: { kind: "standalone", showChevron: true } };
export const Disabled: Story = { args: { disabled: true } };
