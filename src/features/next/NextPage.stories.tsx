import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { stableNextFixture } from "./fixtures";
import { NextPage } from "./NextPage";

const meta = {
  title: "Features/Next/Stable",
  component: NextPage,
  args: { model: stableNextFixture },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof NextPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Screen: Story = {};
