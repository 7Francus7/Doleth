import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ConfirmPaymentForm, PaymentConfirmationFeedback } from "../../components/finance/ConfirmPaymentForm";

function ConfirmationStory({ success = false }: { success?: boolean }) {
  return <main style={{ width: "min(100%, 760px)", padding: 16 }}>
    {success
      ? <PaymentConfirmationFeedback amount="148.300,00" concept="Expensas" currency="ARS" detail="Salieron $148.300,00 de Cuenta principal." returnTo="/proximo?horizon=30" transactionId="tx-1" />
      : <ConfirmPaymentForm accountBalanceCents="85000000" accountName="Cuenta principal" concept="Expensas" currency="ARS" paymentId="payment-1" plannedAmount="148.300,00" returnTo="/proximo?horizon=30" today="2026-08-13" />}
  </main>;
}

const meta = { title: "Features/Plan/Confirmación", component: ConfirmationStory, args: { success: false }, parameters: { layout: "fullscreen" } } satisfies Meta<typeof ConfirmationStory>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Confirmar: Story = {};
export const Exito: Story = { args: { success: true } };
