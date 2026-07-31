import { ProgressPage } from "../../features/progress/ProgressPage";
import { getProgressModel } from "../../features/progress/data/getProgressModel";
import { requireOnboardedUser } from "../../lib/auth/guards";

export const dynamic = "force-dynamic";
export const metadata = { title: "Progreso" };

export default async function ProgresoPage() {
  const user = await requireOnboardedUser("/progreso");
  return <ProgressPage model={await getProgressModel(user.id)} />;
}
