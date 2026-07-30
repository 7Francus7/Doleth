import type { Metadata } from "next";
import { AuthShell } from "../../components/auth/AuthShell";
import { AdministrativeResetForm } from "../../components/auth/AdministrativeResetForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recuperar acceso temporal · Doleth",
  robots: { index: false },
};

export default function AdministrativeAccessPage() {
  return (
    <AuthShell
      eyebrow="Beta privada"
      intro="Este procedimiento temporal reemplaza la recuperación por correo durante la beta. Al guardar, todas las sesiones anteriores quedan cerradas."
      title="Elegir contraseña nueva"
    >
      <AdministrativeResetForm />
    </AuthShell>
  );
}
