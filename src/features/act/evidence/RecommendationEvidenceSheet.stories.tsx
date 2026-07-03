import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { recommendationEvidenceFixture } from "./fixtures";
import { RecommendationEvidenceSheet } from "./RecommendationEvidenceSheet";

const meta = {
  title: "Actuar/Recommendation/Evidence",
  component: RecommendationEvidenceSheet,
  args: {
    model: recommendationEvidenceFixture,
    open: true,
    onOpenChange: () => undefined,
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof RecommendationEvidenceSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};
