import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { InvestmentForm } from "../../components/finance/InvestmentForm";

function InvestmentFormStory() {
  return <main style={{ maxWidth: 928, margin: "0 auto", padding: "32px 20px 96px" }}>
    <header style={{ marginBottom: 24 }}>
      <p style={{ fontFamily: "var(--font-ibm-plex-mono)", fontSize: 11, textTransform: "uppercase" }}>Cartera</p>
      <h1 style={{ fontSize: "clamp(36px, 8vw, 64px)", lineHeight: .95 }}>Nueva inversión</h1>
    </header>
    <InvestmentForm />
  </main>;
}

const meta = { title: "V2/Cut 6/Investment form", component: InvestmentFormStory, parameters: { layout: "fullscreen", nextjs: { appDirectory: true } } } satisfies Meta<typeof InvestmentFormStory>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Alta: Story = {};
