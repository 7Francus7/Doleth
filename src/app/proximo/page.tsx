import { NextPage } from "../../features/next";
import { getNextModel } from "../../features/next/data/getNextModel";

export const dynamic = "force-dynamic";

export default async function ProximoPage() {
  return <NextPage model={await getNextModel()} />;
}
