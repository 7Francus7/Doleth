import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { emptyNowFixture } from "./fixtures";
import { NowPage } from "./NowPage";

const meta = {
  title: "Features/Now/Sin cuentas",
  component: NowPage,
  args: { model: emptyNowFixture },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof NowPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Screen: Story = {};
