import * as Dialog from "@radix-ui/react-dialog";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SheetHeader } from "./SheetHeader";

const meta = {
  title: "Design System/Navigation/Sheet Header",
  component: SheetHeader,
  args: { title: "Disponible" },
  decorators: [
    (Story) => (
      <Dialog.Root defaultOpen>
        <Story />
      </Dialog.Root>
    ),
  ],
  parameters: { layout: "padded" },
} satisfies Meta<typeof SheetHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { subtitle: "Se calcula así" } };
export const WithoutSubtitle: Story = {};
export const WithoutClose: Story = { args: { close: "none" } };
