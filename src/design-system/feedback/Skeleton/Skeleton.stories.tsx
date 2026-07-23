import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Skeleton } from "./Skeleton";
import { ShellSkeleton, SurfaceSkeleton } from "../screens";

const meta = {
  title: "Design System/Feedback/Skeleton",
  component: Skeleton,
  parameters: { layout: "padded" },
  argTypes: {
    variant: { control: "select", options: ["line", "block", "circle", "value", "card", "row"] },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Line: Story = { args: { variant: "line", width: "70%" } };
export const MultiLine: Story = { args: { variant: "line", lines: 4 } };
export const Value: Story = { args: { variant: "value" } };
export const Card: Story = { args: { variant: "card" } };
export const Row: Story = { args: { variant: "row" } };
export const Circle: Story = { args: { variant: "circle" } };

export const SurfaceScreen: StoryObj = {
  render: () => <SurfaceSkeleton meter sections={2} rows={3} />,
  parameters: { layout: "fullscreen" },
};

export const ShellList: StoryObj = {
  render: () => <ShellSkeleton body="list" filters rows={5} />,
  parameters: { layout: "fullscreen" },
};
