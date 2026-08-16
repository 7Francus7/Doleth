import "server-only";
import { getPatrimonyData } from "../../../lib/finance/data";
import { buildPatrimonyModel } from "../model";

export async function getPatrimonyModel(userId: string) {
  const data = await getPatrimonyData(userId);
  return buildPatrimonyModel({
    displayCurrency: data.display.currency,
    displaySymbol: data.display.symbol,
    accountsComplete: data.display.complete,
    investmentsComplete: data.investmentsComplete,
    investedBasisComplete: data.investedBasisComplete,
    accounts: data.accounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      currency: account.currency,
      status: account.status,
      liability: account.liability,
      originalCents: account.originalCents,
      valuedCents: account.balanceCents,
    })),
    investments: data.investments,
    accountValuationNote: data.accountValuationNote,
    investmentValuationNote: data.investmentValuationNote,
  });
}
