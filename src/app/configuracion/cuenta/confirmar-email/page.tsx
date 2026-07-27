import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "../../../../components/auth/AuthShell";
import { ConfirmEmailChangeForm } from "../../../../components/auth/ConfirmEmailChangeForm";
import { requireUser } from "../../../../lib/auth/guards";
import { TOKEN_FAILURE_MESSAGES, inspectToken } from "../../../../lib/auth/tokens";
import styles from "../../../../components/auth/auth.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confirmar correo nuevo · Doleth",
  robots: { index: false },
};

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function ConfirmEmailChangePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const token = first((await searchParams).token);
  // Confirmar el cambio exige estar dentro de la cuenta: el enlace solo no basta.
  const user = await requireUser(`/configuracion/cuenta/confirmar-email?token=${encodeURIComponent(token ?? "")}`);
  const lookup = await inspectToken(token, "EMAIL_CHANGE");
  const usable = lookup.ok && lookup.token.userId === user.id;

  if (!usable) {
    return (
      <AuthShell
        eyebrow="Tu cuenta"
        intro={lookup.ok ? "Este enlace no corresponde a tu cuenta." : TOKEN_FAILURE_MESSAGES[lookup.reason]}
        title="Este enlace no sirve"
      >
        <div className={styles.card}>
          <Link className={styles.link} href="/configuracion/cuenta">
            Volver a mi cuenta
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Tu cuenta"
      intro={`Vas a pasar a entrar con ${lookup.token.newEmail}. Tu correo anterior deja de servir para iniciar sesión.`}
      title="Confirmá tu correo nuevo"
    >
      <div className={styles.card}>
        <ConfirmEmailChangeForm token={token ?? ""} />
        <Link className={styles.link} href="/configuracion/cuenta">
          Cancelar
        </Link>
      </div>
    </AuthShell>
  );
}
