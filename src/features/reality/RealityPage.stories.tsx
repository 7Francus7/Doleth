import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { stableRealityFixture } from "./fixtures";
import { RealityPage } from "./RealityPage";

const meta = {
  title: "Features/Reality/Stable",
  component: RealityPage,
  args: { model: stableRealityFixture },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof RealityPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Screen: Story = {};
