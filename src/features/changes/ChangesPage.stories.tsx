import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { stableChangesFixture } from "./fixtures";
import { ChangesPage } from "./ChangesPage";

const meta = {
  title: "Features/Changes/Stable",
  component: ChangesPage,
  args: { model: stableChangesFixture },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ChangesPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Screen: Story = {};
