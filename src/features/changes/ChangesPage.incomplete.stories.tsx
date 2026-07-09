import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { incompleteChangesFixture } from "./fixtures";
import { ChangesPage } from "./ChangesPage";

const meta = {
  title: "Features/Changes/Incomplete",
  component: ChangesPage,
  args: { model: incompleteChangesFixture },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ChangesPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Screen: Story = {};
