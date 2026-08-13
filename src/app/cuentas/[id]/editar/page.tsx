import { notFound } from "next/navigation";
import { OperationalShell } from "../../../../components/finance/OperationalShell";
import { AccountMetadataForm } from "../../../../features/accounts/AccountMetadataForm";
import { accountTypeLabel } from "../../../../lib/finance/accountKind";
import { requireOnboardedUser } from "../../../../lib/auth/guards";
import { getAccountDetail } from "../../../../lib/finance/data";

export const metadata = { title: "Editar cuenta" };

export default async function EditAccountRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireOnboardedUser(`/cuentas/${id}/editar`);
  const account = await getAccountDetail(user.id, id);
  if (!account) notFound();
  return <OperationalShell back={{ href: `/cuentas/${id}`, label: "Volver a la cuenta" }} eyebrow="Metadatos seguros" intro="Podés cambiar cómo reconocés la cuenta. Sus hechos financieros no se reescriben." title="Editar cuenta"><AccountMetadataForm account={{ id, name: account.name, typeLabel: accountTypeLabel(account.type), currency: account.currency, creditCard: account.creditCard }} /></OperationalShell>;
}
