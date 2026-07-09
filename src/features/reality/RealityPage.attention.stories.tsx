import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { attentionRealityFixture } from "./fixtures";
import { RealityPage } from "./RealityPage";

const meta = {
  title: "Features/Reality/Attention",
  component: RealityPage,
  args: { model: attentionRealityFixture },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof RealityPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Screen: Story = {};
