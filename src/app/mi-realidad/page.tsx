import { RealityPage } from "../../features/reality/RealityPage";
import { getRealityModel } from "../../features/reality/data/getRealityModel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mi realidad" };

export default async function MiRealidadPage() {
  return <RealityPage model={await getRealityModel()} />;
}
