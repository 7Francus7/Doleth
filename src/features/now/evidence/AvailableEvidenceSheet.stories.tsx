import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AvailableEvidenceSheet } from "./AvailableEvidenceSheet";
import { availableEvidenceFixture } from "./fixtures";

const meta = {
  title: "Features/Now/Evidence/Available",
  component: AvailableEvidenceSheet,
  args: {
    model: availableEvidenceFixture,
    open: true,
    onOpenChange: () => undefined,
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AvailableEvidenceSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};
