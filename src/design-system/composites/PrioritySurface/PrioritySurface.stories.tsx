import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PrioritySurface } from "./PrioritySurface";

const meta = {
  title: "Composites/PrioritySurface",
  component: PrioritySurface,
  args: {
    children: (
      <div style={{ display: "grid", gap: 16, padding: 28 }}>
        <small style={{ fontFamily: "var(--font-ibm-plex-mono)", textTransform: "uppercase" }}>
          Situación actual
        </small>
        <strong style={{ fontSize: 34 }}>−$742.380,75</strong>
        <span>Los pagos cargados superan el dinero de tus cuentas.</span>
      </div>
    ),
    tone: "pressure",
  },
  parameters: { a11y: { test: "error" } },
} satisfies Meta<typeof PrioritySurface>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pressure: Story = {};
export const Positive: Story = { args: { tone: "positive" } };
export const Action: Story = { args: { tone: "action" } };
