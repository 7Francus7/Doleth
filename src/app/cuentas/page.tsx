import { OperationalShell } from "../../components/finance/OperationalShell";
import { AccountsPage } from "../../features/accounts/AccountsPage";
import { buildAccountsViewModel } from "../../features/accounts/model";
import { requireOnboardedUser } from "../../lib/auth/guards";
import { getValuedAccounts } from "../../lib/finance/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cuentas" };

export default async function AccountsRoute() {
  const user = await requireOnboardedUser("/cuentas");
  const data = await getValuedAccounts(user.id);
  const model = buildAccountsViewModel({
    displayCurrency: data.context.currency,
    displaySymbol: data.context.symbol,
    complete: data.context.complete,
    accounts: data.accounts.map((account) => ({
      id: account.id, name: account.name, type: account.type, currency: account.currency,
      status: account.status, liability: account.liability, originalCents: account.originalCents,
      valuedCents: account.balanceCents,
    })),
  });
  return <OperationalShell eyebrow="Mapa del dinero" intro="Tus cuentas muestran dónde está tu dinero. Tarjetas y ahorro se leen por separado." title="Cuentas" wide><AccountsPage model={model} /></OperationalShell>;
}
