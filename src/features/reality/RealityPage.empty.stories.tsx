import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { emptyRealityFixture } from "./fixtures";
import { RealityPage } from "./RealityPage";

const meta = {
  title: "Features/Reality/Vacía",
  component: RealityPage,
  args: { model: emptyRealityFixture },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof RealityPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Sin cuentas: ninguna cifra, ninguna sección, una sola salida. */
export const Screen: Story = {};
