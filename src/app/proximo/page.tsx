import { NextPage } from "../../features/next";
import { getNextModel } from "../../features/next/data/getNextModel";
import { requireOnboardedUser } from "../../lib/auth/guards";

export const dynamic = "force-dynamic";
export const metadata = { title: "Próximo" };

export default async function ProximoPage() {
  const user = await requireOnboardedUser("/proximo");
  return <NextPage model={await getNextModel(user.id)} />;
}
