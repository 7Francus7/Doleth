import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { attentionChangesFixture } from "./fixtures";
import { ChangesPage } from "./ChangesPage";

const meta = {
  title: "Features/Changes/Attention",
  component: ChangesPage,
  args: { model: attentionChangesFixture },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ChangesPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Screen: Story = {};
