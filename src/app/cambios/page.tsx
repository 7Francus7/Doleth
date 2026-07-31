import { ChangesPage } from "../../features/changes/ChangesPage";
import { getChangesModel } from "../../features/changes/data/getChangesModel";
import { requireOnboardedUser } from "../../lib/auth/guards";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cambios" };

export default async function CambiosPage() {
  const user = await requireOnboardedUser("/cambios");
  return <ChangesPage model={await getChangesModel(user.id)} />;
}
