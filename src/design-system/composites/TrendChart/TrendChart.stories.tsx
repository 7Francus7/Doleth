import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TrendChart, type TrendPoint } from "./TrendChart";

const active: readonly TrendPoint[] = [
  { month: "2026-02", label: "Feb", income: "142.000", expense: "118.400", net: "23.600", netPrefix: "+$", netState: "positive", incomePercent: 62, expensePercent: 52 },
  { month: "2026-03", label: "Mar", income: "138.500", expense: "151.200", net: "12.700", netPrefix: "-$", netState: "negative", incomePercent: 60, expensePercent: 66 },
  { month: "2026-04", label: "Abr", income: "165.000", expense: "121.900", net: "43.100", netPrefix: "+$", netState: "positive", incomePercent: 72, expensePercent: 53 },
  { month: "2026-05", label: "May", income: "158.300", expense: "139.700", net: "18.600", netPrefix: "+$", netState: "positive", incomePercent: 69, expensePercent: 61 },
  { month: "2026-06", label: "Jun", income: "172.400", expense: "144.100", net: "28.300", netPrefix: "+$", netState: "positive", incomePercent: 75, expensePercent: 63 },
  { month: "2026-07", label: "Jul", income: "189.000", expense: "132.500", net: "56.500", netPrefix: "+$", netState: "positive", incomePercent: 82, expensePercent: 58 },
];

const empty: readonly TrendPoint[] = active.map((point) => ({
  ...point,
  income: "0",
  expense: "0",
  net: "0",
  netPrefix: "$",
  netState: "neutral",
  incomePercent: 4,
  expensePercent: 4,
}));

const meta = {
  title: "Design System/Composites/Trend Chart",
  component: TrendChart,
  parameters: { layout: "padded" },
} satisfies Meta<typeof TrendChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  args: { points: active },
};

export const Empty: Story = {
  args: { points: empty },
};
