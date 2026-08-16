import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OperationalShell } from "../../../components/finance/OperationalShell";
import { InvestmentDetail } from "../../../features/patrimony/InvestmentDetail";
import { buildInvestmentDetailModel } from "../../../features/patrimony/model";
import { requireOnboardedUser } from "../../../lib/auth/guards";
import { getPatrimonyData } from "../../../lib/finance/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Detalle de inversión" };

export default async function InvestmentDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireOnboardedUser(`/inversiones/${id}`);
  const data = await getPatrimonyData(user.id);
  const investment = data.investments.find((candidate) => candidate.id === id);
  if (!investment) notFound();
  return <OperationalShell back={{ href: "/mi-realidad#inversiones", label: "Volver a Patrimonio" }} eyebrow="Patrimonio" title="Detalle de inversión" wide><InvestmentDetail model={buildInvestmentDetailModel(investment)} /></OperationalShell>;
}
