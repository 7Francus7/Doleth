import { AccountForm } from "../../../components/finance/AccountForm";
import { OperationalShell } from "../../../components/finance/OperationalShell";

export default function NewAccountPage() {
  return <OperationalShell eyebrow="Configuración inicial" title="Nueva cuenta" intro="Cargá el saldo disponible al comenzar. Después, Doleth solo lo modifica mediante movimientos."><AccountForm /></OperationalShell>;
}
