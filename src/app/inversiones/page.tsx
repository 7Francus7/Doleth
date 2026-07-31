import { InvestmentsPage } from "../../features/investments";
import { getInvestmentsModel } from "../../features/investments/data/getInvestmentsModel";
import { requireOnboardedUser } from "../../lib/auth/guards";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inversiones" };

export default async function InversionesPage() {
  const user = await requireOnboardedUser("/inversiones");
  return <InvestmentsPage model={await getInvestmentsModel(user.id)} />;
}
