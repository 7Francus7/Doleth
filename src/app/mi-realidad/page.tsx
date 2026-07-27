import { RealityPage, stableRealityFixture } from "../../features/reality";
import { requireOnboardedUser } from "../../lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function MiRealidadPage() {
  await requireOnboardedUser("/mi-realidad");
  return <RealityPage model={stableRealityFixture} />;
}
