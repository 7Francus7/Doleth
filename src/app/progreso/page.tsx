import { ProgressPage } from "../../features/progress/ProgressPage";
import { getProgressModel } from "../../features/progress/data/getProgressModel";

export const dynamic = "force-dynamic";

export default async function ProgresoPage() {
  return <ProgressPage model={await getProgressModel()} />;
}
