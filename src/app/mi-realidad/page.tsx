import { PatrimonyPage } from "../../features/patrimony/PatrimonyPage";
import { getPatrimonyModel } from "../../features/patrimony/data/getPatrimonyModel";
import { requireOnboardedUser } from "../../lib/auth/guards";

export const dynamic = "force-dynamic";
export const metadata = { title: "Patrimonio" };

export default async function PatrimonyRoute() {
  const user = await requireOnboardedUser("/mi-realidad");
  return <PatrimonyPage model={await getPatrimonyModel(user.id)} />;
}
