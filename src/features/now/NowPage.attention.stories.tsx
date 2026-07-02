import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { attentionNowFixture } from "./fixtures";
import { NowPage } from "./NowPage";

const meta = {
  title: "Now/Attention",
  component: NowPage,
  args: { model: attentionNowFixture },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof NowPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Screen: Story = {};
