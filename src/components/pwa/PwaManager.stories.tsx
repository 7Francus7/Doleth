import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PwaNotice } from "./PwaManager";

const meta = {
  title: "App/PWA notices",
  component: PwaNotice,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PwaNotice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Offline: Story = { args: { kind: "offline" } };
export const UpdateAvailable: Story = {
  args: { kind: "update", onLater() {}, onUpdate() {} },
};
