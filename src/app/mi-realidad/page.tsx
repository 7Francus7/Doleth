import { RealityPage } from "../../features/reality/RealityPage";
import { getRealityModel } from "../../features/reality/data/getRealityModel";
import { requireOnboardedUser } from "../../lib/auth/guards";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mi realidad" };

export default async function MiRealidadPage() {
  const user = await requireOnboardedUser("/mi-realidad");
  return <RealityPage model={await getRealityModel(user.id)} />;
}
