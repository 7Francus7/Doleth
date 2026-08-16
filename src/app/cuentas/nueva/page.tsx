import type { Metadata } from "next";
import { AccountForm } from "../../../components/finance/AccountForm";
import { OperationalShell } from "../../../components/finance/OperationalShell";
import { requireOnboardedUser } from "../../../lib/auth/guards";

export const metadata: Metadata = { title: "Nueva cuenta" };

export default async function NewAccountPage() {
  await requireOnboardedUser("/cuentas/nueva");
  return <OperationalShell back={{ href: "/cuentas", label: "Volver a cuentas" }} eyebrow="Punto de partida" title="Nueva cuenta" intro="Definí dónde está tu dinero al comenzar. Después, el saldo cambia únicamente mediante movimientos."><AccountForm /></OperationalShell>;
}
