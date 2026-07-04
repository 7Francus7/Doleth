import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { recommendationActFixture } from "./fixtures";
import { ActPage } from "./ActPage";
import type { ActDecisionState } from "./model";

const meta = {
  title: "Actuar/Recommendation",
  component: ActPage,
  args: {
    model: recommendationActFixture,
    initialDecisionState: "idle" satisfies ActDecisionState,
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ActPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Screen: Story = {};
export const Applied: Story = {
  args: { initialDecisionState: "applied" },
};
export const Deferred: Story = {
  args: { initialDecisionState: "deferred" },
};
export const Dismissed: Story = {
  args: { initialDecisionState: "dismissed" },
};
