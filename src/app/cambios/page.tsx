import { ChangesPage } from "../../features/changes/ChangesPage";
import { getChangesModel } from "../../features/changes/data/getChangesModel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cambios" };

export default async function CambiosPage() {
  return <ChangesPage model={await getChangesModel()} />;
}
