import type { Metadata } from "next";
import { AccountForm } from "../../../components/finance/AccountForm";
import { OperationalShell } from "../../../components/finance/OperationalShell";

export const metadata: Metadata = { title: "Nueva cuenta" };

export default function NewAccountPage() {
  return <OperationalShell eyebrow="Configuración inicial" title="Nueva cuenta" intro="Cargá el saldo disponible al comenzar. Después, Doleth solo lo modifica mediante movimientos."><AccountForm /></OperationalShell>;
}
