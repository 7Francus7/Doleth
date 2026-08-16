import { PlanPage } from "../../features/plan/PlanPage";
import { buildPlanModel, normalizePlanHorizon } from "../../features/plan/model";
import { requireOnboardedUser } from "../../lib/auth/guards";
import { getUpcomingData } from "../../lib/finance/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Plan" };

const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export default async function ProximoPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireOnboardedUser("/proximo");
  const horizon = normalizePlanHorizon(first((await searchParams).horizon));
  const data = await getUpcomingData(user.id);
  return <PlanPage model={buildPlanModel({ today: data.today, horizon, pending: data.pending, paid: data.paid })} />;
}
