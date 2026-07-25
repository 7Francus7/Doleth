import { ClosePage } from "../../../features/close/ClosePage";
import { getCloseModel } from "../../../features/close/data/getCloseModel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Revisión del mes" };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function MonthlyReviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  // El período y el paso viven en la URL: se puede volver con el botón del
  // navegador y compartir la revisión sin estado escondido en el cliente.
  return <ClosePage model={await getCloseModel(first(query.periodo), first(query.paso))} />;
}
