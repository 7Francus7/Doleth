import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { recommendationActFixture } from "./fixtures";
import { ActPage } from "./ActPage";

const meta = {
  title: "Actuar/Recommendation",
  component: ActPage,
  args: { model: recommendationActFixture },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ActPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Screen: Story = {};
