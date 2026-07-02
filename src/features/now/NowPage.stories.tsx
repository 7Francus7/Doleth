import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { stableNowFixture } from "./fixtures";
import { NowPage } from "./NowPage";

const meta = {
  title: "Features/Now/Stable",
  component: NowPage,
  args: { model: stableNowFixture },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof NowPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Screen: Story = {};
