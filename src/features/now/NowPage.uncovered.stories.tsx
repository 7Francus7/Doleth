import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { uncoveredNowFixture } from "./fixtures";
import { NowPage } from "./NowPage";

const meta = {
  title: "Features/Now/Cobertura insuficiente",
  component: NowPage,
  args: { model: uncoveredNowFixture },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof NowPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Importes largos y faltante: el número principal no se corta ni desborda. */
export const ImporteGrande: Story = {};

export const Mobile320: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: 320, overflowX: "hidden", margin: "0 auto" }}>
        <Story />
      </div>
    ),
  ],
};
