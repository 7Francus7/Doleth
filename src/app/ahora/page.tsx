import { NowPage } from "../../features/now/NowPage";
import { getNowModel } from "../../features/now/data/getNowModel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ahora" };

export default async function AhoraPage() {
  return <NowPage model={await getNowModel()} />;
}
