import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { attentionProgressFixture } from "./fixtures";
import { ProgressPage } from "./ProgressPage";

const meta = {
  title: "Features/Progress/Attention",
  component: ProgressPage,
  args: { model: attentionProgressFixture },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ProgressPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Screen: Story = {};
