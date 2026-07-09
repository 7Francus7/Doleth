import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EvidenceBreakdownSheet } from "../../evidence";
import { availableEvidenceFixture } from "./fixtures";

const meta = {
  title: "Features/Now/Evidence/Available",
  component: EvidenceBreakdownSheet,
  args: {
    model: availableEvidenceFixture,
    open: true,
    onOpenChange: () => undefined,
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof EvidenceBreakdownSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};
