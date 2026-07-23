import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { AppNav } from "./AppNav";

const meta = {
  title: "App/AppNav",
  component: AppNav,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true, navigation: { pathname: "/ahora" } },
  },
} satisfies Meta<typeof AppNav>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Barra inferior mobile: Ahora · Movimientos · Registrar · Próximo · Más. */
export const Mobile: Story = {};

/** Estado activo sobre un destino principal. */
export const MovimientosActivo: Story = {
  parameters: { nextjs: { appDirectory: true, navigation: { pathname: "/movimientos" } } },
};

/** En una ruta secundaria, "Más" queda marcado como activo. */
export const RutaSecundaria: Story = {
  parameters: { nextjs: { appDirectory: true, navigation: { pathname: "/cambios" } } },
};

/** En viewport ancho la barra se mantiene centrada y con etiquetas de texto. */
export const Escritorio: Story = {
  globals: { viewport: { value: "desktop" } },
};

/** El panel Más se abre y lista las superficies secundarias. */
export const PanelMasAbierto: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Más superficies" }));
    const dialog = await within(document.body).findByRole("dialog");
    await expect(within(dialog).getByRole("link", { name: /Cambios/ })).toBeInTheDocument();
    await expect(within(dialog).getByRole("button", { name: "Cerrar sesión" })).toBeInTheDocument();
  },
};
