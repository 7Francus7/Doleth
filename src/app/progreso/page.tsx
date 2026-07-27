import { ProgressPage, stableProgressFixture } from "../../features/progress";
import { requireOnboardedUser } from "../../lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function ProgresoPage() {
  await requireOnboardedUser("/progreso");
  return <ProgressPage model={stableProgressFixture} />;
}
