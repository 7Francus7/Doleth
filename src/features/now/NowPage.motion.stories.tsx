import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Button } from "../../design-system/primitives/Button";
import { attentionNowFixture, incompleteNowFixture, stableNowFixture } from "./fixtures";
import { NowPage } from "./NowPage";
import styles from "./NowPage.motion.stories.module.css";

type Scenario = "stable" | "attention" | "incomplete";

const models = {
  stable: stableNowFixture,
  attention: attentionNowFixture,
  incomplete: incompleteNowFixture,
} as const;

function MotionScenario() {
  const [scenario, setScenario] = useState<Scenario>("stable");

  return (
    <>
      <div aria-label="Motion fixture controls" className={styles.controls}>
        {(Object.keys(models) as Scenario[]).map((item) => (
          <Button
            aria-pressed={scenario === item}
            key={item}
            kind={scenario === item ? "primary" : "ghost"}
            onClick={() => setScenario(item)}
            size="md"
          >
            {item}
          </Button>
        ))}
      </div>
      <NowPage model={models[scenario]} />
    </>
  );
}

const meta = {
  title: "Now/Motion",
  component: NowPage,
  args: { model: stableNowFixture },
  parameters: { layout: "fullscreen" },
  render: () => <MotionScenario />,
} satisfies Meta<typeof NowPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FixtureChanges: Story = {};
