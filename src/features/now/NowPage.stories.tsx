import type { ComponentType } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { emptyNowFixture, stableNowFixture } from "./fixtures";
import { NowPage } from "./NowPage";

const meta = {
  title: "V2/Inicio",
  component: NowPage,
  args: { model: stableNowFixture },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof NowPage>;

export default meta;
type Story = StoryObj<typeof meta>;

const fixedWidth = (width: number) => {
  function FixedWidthStory(Story: ComponentType) {
    return <div style={{ width, maxWidth: "100%", overflowX: "clip", margin: "0 auto" }}><Story /></div>;
  }
  return FixedWidthStory;
};

export const Screen: Story = {};
export const Mobile320: Story = { decorators: [fixedWidth(320)] };
export const Mobile375: Story = { decorators: [fixedWidth(375)] };
export const Mobile390: Story = { decorators: [fixedWidth(390)] };
export const Empty: Story = { args: { model: emptyNowFixture } };
export const LongAmounts: Story = {
  args: {
    model: {
      ...stableNowFixture,
      hero: { ...stableNowFixture.hero, value: "12.345.678.901,22" },
      position: {
        ...stableNowFixture.position,
        rows: stableNowFixture.position.rows.map((row) => ({ ...row, value: "9.876.543.210,00" })),
      },
    },
  },
  decorators: [fixedWidth(320)],
};
export const Desktop: Story = { globals: { viewport: { value: "desktop" } } };
