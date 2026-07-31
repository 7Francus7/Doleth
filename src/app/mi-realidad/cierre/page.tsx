import { ClosePage } from "../../../features/close/ClosePage";
import { getCloseModel } from "../../../features/close/data/getCloseModel";
import { requireOnboardedUser } from "../../../lib/auth/guards";

export const dynamic = "force-dynamic";
export const metadata = { title: "Revisión del mes" };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function MonthlyReviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireOnboardedUser("/mi-realidad/cierre");
  const query = await searchParams;
  // El período y el paso viven en la URL: se puede volver con el botón del
  // navegador y compartir la revisión sin estado escondido en el cliente. El
  // dueño no: ése sale de la sesión.
  return <ClosePage model={await getCloseModel(user.id, first(query.periodo), first(query.paso))} />;
}
