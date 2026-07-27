import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DataExportPanel } from "./DataExportPanel";

const meta = {
  title: "Finance/Data export",
  component: DataExportPanel,
  parameters: { layout: "padded" },
} satisfies Meta<typeof DataExportPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};
