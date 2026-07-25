import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { largeRealityFixture } from "./fixtures";
import { RealityPage } from "./RealityPage";

const meta = {
  title: "Features/Reality/Importes grandes",
  component: RealityPage,
  args: { model: largeRealityFixture },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof RealityPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Ocho cifras y compromisos caídos: nada se desborda y la degradación se dice. */
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
