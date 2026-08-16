import type { Metadata } from "next";
import { InvestmentForm } from "../../../components/finance/InvestmentForm";
import { OperationalShell } from "../../../components/finance/OperationalShell";
import { requireOnboardedUser } from "../../../lib/auth/guards";

export const metadata: Metadata = { title: "Nueva inversión" };

export default async function NewInvestmentPage() {
  await requireOnboardedUser("/inversiones/nueva");
  return (
    <OperationalShell
      eyebrow="Cartera"
      title="Nueva inversión"
      intro="Registrá una tenencia actual. Si cargás símbolo y cantidad, Doleth usa el último precio disponible; si no, conserva el valor que declarás."
    >
      <InvestmentForm />
    </OperationalShell>
  );
}
