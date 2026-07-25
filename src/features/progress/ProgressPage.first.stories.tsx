import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { firstPeriodProgressFixture } from "./fixtures";
import { ProgressPage } from "./ProgressPage";

const meta = {
  title: "Features/Progress/Primer período",
  component: ProgressPage,
  args: { model: firstPeriodProgressFixture },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ProgressPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Screen: Story = {};
