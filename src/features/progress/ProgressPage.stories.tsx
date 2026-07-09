import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { stableProgressFixture } from "./fixtures";
import { ProgressPage } from "./ProgressPage";

const meta = {
  title: "Features/Progress/Stable",
  component: ProgressPage,
  args: { model: stableProgressFixture },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ProgressPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Screen: Story = {};
