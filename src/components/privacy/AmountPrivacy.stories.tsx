import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  AmountPrivacyProvider,
  AmountPrivacyToggle,
  SensitiveAmount,
} from "./AmountPrivacy";

const meta = {
  title: "Privacy/Amount privacy",
  component: AmountPrivacyToggle,
  decorators: [
    (Story) => (
      <AmountPrivacyProvider>
        <div style={{ display: "grid", gap: 20, maxWidth: 420, padding: 24 }}>
          <p style={{ fontVariantNumeric: "tabular-nums", fontSize: 32 }}>
            <SensitiveAmount>$1.195.300</SensitiveAmount>
          </p>
          <Story />
        </div>
      </AmountPrivacyProvider>
    ),
  ],
  parameters: { layout: "centered" },
} satisfies Meta<typeof AmountPrivacyToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Visible: Story = {};
