import { incompleteNowFixture } from "../../features/now/fixtures";
import { NowPage } from "../../features/now/NowPage";

export default function AhoraPage() {
  return <NowPage model={incompleteNowFixture} />;
}
