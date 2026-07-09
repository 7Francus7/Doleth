import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { emptyProgressFixture } from "./fixtures";
import { ProgressPage } from "./ProgressPage";

const meta = {
  title: "Features/Progress/Empty",
  component: ProgressPage,
  args: { model: emptyProgressFixture },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ProgressPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Screen: Story = {};
