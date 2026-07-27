import { ActPage, recommendationActFixture } from "../../features/act";
import { requireOnboardedUser } from "../../lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function ActuarPage() {
  await requireOnboardedUser("/actuar");
  return <ActPage model={recommendationActFixture} />;
}
