import { NowPage } from "../../features/now/NowPage";
import { getNowModel } from "../../features/now/data/getNowModel";
import { requireOnboardedUser } from "../../lib/auth/guards";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inicio" };

export default async function AhoraPage() {
  const user = await requireOnboardedUser("/ahora");
  return <NowPage model={await getNowModel(user.id)} />;
}
