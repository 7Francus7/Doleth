import { ChangesPage, stableChangesFixture } from "../../features/changes";
import { requireOnboardedUser } from "../../lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function CambiosPage() {
  await requireOnboardedUser("/cambios");
  return <ChangesPage model={stableChangesFixture} />;
}
