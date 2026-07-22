import { NowPage } from "../../features/now/NowPage";
import { getNowModel } from "../../features/now/data/getNowModel";

export const dynamic = "force-dynamic";

export default async function AhoraPage() {
  return <NowPage model={await getNowModel()} />;
}
