import { InvestmentsPage } from "../../features/investments";
import { getInvestmentsModel } from "../../features/investments/data/getInvestmentsModel";

export const dynamic = "force-dynamic";

export default async function InversionesPage() {
  return <InvestmentsPage model={await getInvestmentsModel()} />;
}
