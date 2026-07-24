import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { longNextFixture } from "./fixtures";
import { NextPage } from "./NextPage";

const meta = {
  title: "Features/Next/Timeline largo",
  component: NextPage,
  args: { model: longNextFixture },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof NextPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Screen: Story = {};

export const Mobile320: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: 320, overflowX: "hidden", margin: "0 auto" }}>
        <Story />
      </div>
    ),
  ],
};
