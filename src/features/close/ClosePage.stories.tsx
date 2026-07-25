import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  accountsCloseFixture,
  emptyCloseFixture,
  negativeResultCloseFixture,
  overdueCloseFixture,
  periodCloseFixture,
  positiveResultCloseFixture,
  summaryCloseFixture,
  warningsCloseFixture,
} from "./fixtures";
import { ClosePage } from "./ClosePage";

const meta = {
  title: "Features/Close/Revisión del mes",
  component: ClosePage,
  args: { model: periodCloseFixture },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ClosePage>;

export default meta;
type Story = StoryObj<typeof meta>;

const mobile320 = [
  (Story: () => React.ReactElement) => (
    <div style={{ width: 320, overflowX: "hidden", margin: "0 auto" }}>
      <Story />
    </div>
  ),
];

/** Paso 1: elegir período. Dos meses civiles, ninguno arbitrario. */
export const Periodo: Story = {};

/** Sin cuentas no hay período que revisar. */
export const SinDatos: Story = { args: { model: emptyCloseFixture } };

/** Paso intermedio: cuentas activas y archivadas con saldo inicial y final. */
export const Cuentas: Story = { args: { model: accountsCloseFixture } };

/** Compromisos con un vencido: se declara, no bloquea. */
export const Vencidos: Story = { args: { model: overdueCloseFixture } };

/** Advertencias reconocidas: se puede continuar igual. */
export const ConAdvertencias: Story = { args: { model: warningsCloseFixture } };

/** Resultado positivo, con la igualdad de reconciliación escrita. */
export const ResultadoPositivo: Story = { args: { model: positiveResultCloseFixture } };

/** Resultado negativo y efecto de lo registrado después del período. */
export const ResultadoNegativo: Story = { args: { model: negativeResultCloseFixture } };

/** Resumen final: calculado, no guardado. */
export const Resumen: Story = { args: { model: summaryCloseFixture } };

export const Mobile320: Story = {
  args: { model: warningsCloseFixture },
  decorators: mobile320,
};

export const ResumenMobile320: Story = {
  args: { model: summaryCloseFixture },
  decorators: mobile320,
};
