import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { incompleteNextFixture } from "./fixtures";
import { NextPage } from "./NextPage";

const meta = {
  title: "Features/Next/Incomplete",
  component: NextPage,
  args: { model: incompleteNextFixture },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof NextPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Screen: Story = {};
