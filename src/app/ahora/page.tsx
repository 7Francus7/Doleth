import { NowPage } from "../../features/now/NowPage";
import { getNowModel } from "../../features/now/data/getNowModel";
import { requireOnboardedUser } from "../../lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AhoraPage() {
  const user = await requireOnboardedUser("/ahora");
  return <NowPage model={await getNowModel(user.id)} />;
}
