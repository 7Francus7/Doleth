import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { denseChangesFixture } from "./fixtures";
import { ChangesPage } from "./ChangesPage";

const meta = {
  title: "Features/Changes/Causas numerosas",
  component: ChangesPage,
  args: { model: denseChangesFixture },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ChangesPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Importes en millones y una causa agrupada: el corte de "Otros" tiene que leerse. */
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
