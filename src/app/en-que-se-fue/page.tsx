import { OperationalShell } from "../../components/finance/OperationalShell";
import { SpendingPage } from "../../features/spending";
import { getSpendingModel } from "../../features/spending/data/getSpendingModel";
import { requireOnboardedUser } from "../../lib/auth/guards";

export const dynamic = "force-dynamic";
export const metadata = { title: "En qué se fue" };

export default async function SpendingRoute({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const user = await requireOnboardedUser("/en-que-se-fue");
  const { mes } = await searchParams;
  return (
    <OperationalShell
      eyebrow="Entender"
      intro="Adónde fue tu plata este mes, con qué se compara y qué de todo eso se repite."
      title="En qué se fue"
    >
      <SpendingPage model={await getSpendingModel(user.id, mes)} />
    </OperationalShell>
  );
}
