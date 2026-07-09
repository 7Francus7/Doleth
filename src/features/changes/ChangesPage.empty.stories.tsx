import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { emptyChangesFixture } from "./fixtures";
import { ChangesPage } from "./ChangesPage";

const meta = {
  title: "Features/Changes/Empty",
  component: ChangesPage,
  args: { model: emptyChangesFixture },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ChangesPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Screen: Story = {};
