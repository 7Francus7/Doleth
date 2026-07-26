import type { Metadata } from "next";
import { InvestmentForm } from "../../../components/finance/InvestmentForm";
import { OperationalShell } from "../../../components/finance/OperationalShell";

export const metadata: Metadata = { title: "Nueva inversión" };

export default function NewInvestmentPage() {
  return (
    <OperationalShell
      eyebrow="Cartera"
      title="Nueva inversión"
      intro="Cargá el monto aportado y su valor actual. Doleth no estima cotizaciones: los valores los actualizás vos."
    >
      <InvestmentForm />
    </OperationalShell>
  );
}
