import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { incompleteRealityFixture } from "./fixtures";
import { RealityPage } from "./RealityPage";

const meta = {
  title: "Features/Reality/Incomplete",
  component: RealityPage,
  args: { model: incompleteRealityFixture },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof RealityPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Screen: Story = {};
