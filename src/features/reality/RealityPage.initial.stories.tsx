import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { initialRealityFixture } from "./fixtures";
import { RealityPage } from "./RealityPage";

const meta = {
  title: "Features/Reality/Inicial",
  component: RealityPage,
  args: { model: initialRealityFixture },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof RealityPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Solo saldo inicial: hay dónde, todavía no hay cómo cambia. */
export const Screen: Story = {};
