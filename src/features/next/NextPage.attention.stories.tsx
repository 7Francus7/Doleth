import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { attentionNextFixture } from "./fixtures";
import { NextPage } from "./NextPage";

const meta = {
  title: "Features/Next/Attention",
  component: NextPage,
  args: { model: attentionNextFixture },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof NextPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Screen: Story = {};
