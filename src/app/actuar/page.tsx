import { ActPage } from "../../features/act/ActPage";
import { getActModel } from "../../features/act/data/getActModel";
import { requireOnboardedUser } from "../../lib/auth/guards";

export const dynamic = "force-dynamic";
export const metadata = { title: "Actuar" };

export default async function ActuarPage() {
  const user = await requireOnboardedUser("/actuar");
  return <ActPage model={await getActModel(user.id)} />;
}
