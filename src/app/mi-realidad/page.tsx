import { RealityPage } from "../../features/reality/RealityPage";
import { getRealityModel } from "../../features/reality/data/getRealityModel";

export const dynamic = "force-dynamic";

export default async function MiRealidadPage() {
  return <RealityPage model={await getRealityModel()} />;
}
