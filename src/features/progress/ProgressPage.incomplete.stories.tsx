import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { incompleteProgressFixture } from "./fixtures";
import { ProgressPage } from "./ProgressPage";

const meta = {
  title: "Features/Progress/Incomplete",
  component: ProgressPage,
  args: { model: incompleteProgressFixture },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ProgressPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Screen: Story = {};
