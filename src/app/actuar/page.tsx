import { ActPage } from "../../features/act/ActPage";
import { getActModel } from "../../features/act/data/getActModel";

export const dynamic = "force-dynamic";

export default async function ActuarPage() {
  return <ActPage model={await getActModel()} />;
}
