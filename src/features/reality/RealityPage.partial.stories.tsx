import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { partialRealityFixture } from "./fixtures";
import { RealityPage } from "./RealityPage";

const meta = {
  title: "Features/Reality/Parcial",
  component: RealityPage,
  args: { model: partialRealityFixture },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof RealityPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Sin ingresos y con un vencido: dos señales sin cumplir, ninguna inventada. */
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
