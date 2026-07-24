import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { incompleteNowFixture } from "./fixtures";
import { NowPage } from "./NowPage";

const meta = {
  title: "Features/Now/Sin pagos próximos",
  component: NowPage,
  args: { model: incompleteNowFixture },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof NowPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Screen: Story = {};
