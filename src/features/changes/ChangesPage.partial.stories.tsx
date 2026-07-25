import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { partialChangesFixture } from "./fixtures";
import { ChangesPage } from "./ChangesPage";

const meta = {
  title: "Features/Changes/Parcial",
  component: ChangesPage,
  args: { model: partialChangesFixture },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ChangesPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Screen: Story = {};
