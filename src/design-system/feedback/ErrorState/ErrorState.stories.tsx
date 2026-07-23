import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ErrorState } from "./ErrorState";

const meta = {
  title: "Design System/Feedback/Error State",
  component: ErrorState,
  parameters: { layout: "padded" },
  argTypes: { variant: { control: "select", options: ["screen", "section", "inline"] } },
} satisfies Meta<typeof ErrorState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Screen: Story = {
  args: {
    variant: "screen",
    title: "Doleth no pudo cargar esta pantalla.",
    description: "No pudimos mostrar esta pantalla. El problema fue solo al cargarla.",
    safetyLine: "Tus datos guardados siguen seguros.",
    primaryAction: <button type="button">Reintentar</button>,
    secondaryAction: <a href="#ahora">Volver a Ahora</a>,
  },
};

export const Section: Story = {
  args: {
    variant: "section",
    title: "No pudimos cargar tus inversiones.",
    description: "El resto de tu realidad financiera sigue disponible.",
    primaryAction: <button type="button">Reintentar</button>,
  },
};

export const Inline: Story = {
  args: {
    variant: "inline",
    title: "No se pudo actualizar esta sección.",
    description: "Podés intentar nuevamente.",
  },
};
