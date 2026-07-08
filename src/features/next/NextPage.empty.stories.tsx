import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { emptyNextFixture } from "./fixtures";
import { NextPage } from "./NextPage";

const meta = {
  title: "Features/Next/Empty",
  component: NextPage,
  args: { model: emptyNextFixture },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof NextPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Screen: Story = {};
