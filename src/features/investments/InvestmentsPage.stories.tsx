import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { InvestmentsPage } from "./InvestmentsPage";
import { emptyInvestments, portfolioInvestments } from "./fixtures";

const meta = {
  title: "Features/Investments/Investments Page",
  component: InvestmentsPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof InvestmentsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Portfolio: Story = {
  args: { model: portfolioInvestments },
};

export const Empty: Story = {
  args: { model: emptyInvestments },
};
