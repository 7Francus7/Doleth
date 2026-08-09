import type { Metadata } from "next";
import Link from "next/link";
import { OperationalShell } from "../../../components/finance/OperationalShell";
import {
  ChangeEmailSection,
  ChangePasswordSection,
  DeleteAccountSection,
  ProfileSection,
  SessionsSection,
} from "../../../components/auth/AccountSettings";
import { requireSession } from "../../../lib/auth/guards";
import { publicEmailAuthEnabled } from "../../../lib/auth/config";
import { PLAN_LABELS, SUBSCRIPTION_LABELS, resolveEntitlements } from "../../../lib/auth/plan";
import { listActiveSessions } from "../../../lib/auth/session";
import { signOutAction } from "./actions";
import styles from "../../../components/auth/settings.module.css";
import authStyles from "../../../components/auth/auth.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tu cuenta · Doleth",
  robots: { index: false },
};

const dateFormatter = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "long", year: "numeric" });
const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Etiqueta legible del dispositivo. Del user agent no guardamos nada más. */
function describeDevice(userAgent: string | null): string {
  if (!userAgent) return "Dispositivo desconocido";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "iPhone o iPad";
  if (/Android/i.test(userAgent)) return "Android";
  if (/Macintosh/i.test(userAgent)) return "Mac";
  if (/Windows/i.test(userAgent)) return "Windows";
  if (/Linux/i.test(userAgent)) return "Linux";
  return "Navegador";
}

function Section({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.section}>
      <header className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <p className={styles.sectionIntro}>{intro}</p>
      </header>
      {children}
    </section>
  );
}

export default async function AccountSettingsPage() {
  const { user, sessionId } = await requireSession("/configuracion/cuenta");
  const [sessions] = await Promise.all([listActiveSessions(user.id)]);
  const entitlements = resolveEntitlements(user);
  const verified = user.emailVerifiedAt !== null;
  const emailFeaturesEnabled = publicEmailAuthEnabled();
  const privateBetaAccess = user.privateBetaActivatedAt !== null;

  return (
    <OperationalShell
      eyebrow="Tu cuenta"
      intro="Tus datos de acceso, tus preferencias y las sesiones abiertas."
      title="Configuración"
      actions={
        <form action={signOutAction}>
          <button className={authStyles.link} type="submit">
            Cerrar sesión
          </button>
        </form>
      }
    >
      <div className={styles.sections}>
        {/* El panel no vive en la navegación principal: no es una superficie del
            producto y mostrarle a todo el mundo un enlace que sólo funciona para
            una persona es ruido. Aparece acá, y sólo para quien puede entrar. */}
        {user.role === "ADMIN" && user.status === "ACTIVE" ? (
          <Section
            intro="Administrar las cuentas de las personas que usan Doleth."
            title="Administración"
          >
            <Link className={authStyles.link} href="/admin">
              Abrir el panel
            </Link>
          </Section>
        ) : null}

        <Section intro="Así te identificamos dentro de Doleth." title="Identidad">
          <dl className={styles.summary}>
            <div className={styles.summaryRow}>
              <dt>Correo</dt>
              <dd>{user.email}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt>Estado del correo</dt>
              <dd>
                <span className={styles.pill} data-tone={verified || privateBetaAccess ? "stable" : "attention"}>
                  {verified ? "Confirmado" : privateBetaAccess ? "Acceso de beta privada" : "Sin confirmar"}
                </span>
              </dd>
            </div>
            <div className={styles.summaryRow}>
              <dt>Alta</dt>
              <dd>{dateFormatter.format(user.createdAt)}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt>Último acceso</dt>
              <dd>{user.lastLoginAt ? dateTimeFormatter.format(user.lastLoginAt) : "—"}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt>Plan</dt>
              <dd>
                {PLAN_LABELS[entitlements.planKey]} · {SUBSCRIPTION_LABELS[entitlements.subscriptionStatus]}
              </dd>
            </div>
          </dl>
        </Section>

        <Section intro="Tu nombre y cómo querés ver importes y fechas." title="Perfil y preferencias">
          <ProfileSection
            defaults={{
              name: user.name,
              primaryCurrency: user.primaryCurrency,
              timeZone: user.timeZone,
              locale: user.locale,
            }}
          />
        </Section>

        <Section
          intro="Pedimos tu contraseña actual porque tener la sesión abierta no alcanza para cambiar una credencial."
          title="Contraseña"
        >
          <ChangePasswordSection />
        </Section>

        {emailFeaturesEnabled ? (
          <Section
            intro="El correo se mueve recién cuando confirmás la dirección nueva. Avisamos también a la anterior."
            title="Cambiar de correo"
          >
            <ChangeEmailSection currentEmail={user.email} />
          </Section>
        ) : (
          <Section
            intro="Durante la beta privada los cambios de correo se gestionan de forma administrativa."
            title="Correo de acceso"
          >
            <p className={styles.sectionIntro}>
              No hay correo transaccional activo. Tu dirección permanece fija hasta habilitar verificación real.
            </p>
          </Section>
        )}

        <Section intro="Cada navegador donde entraste abre una sesión propia." title="Sesiones abiertas">
          <SessionsSection
            currentSessionId={sessionId}
            sessions={sessions.map((session) => ({
              id: session.id,
              createdAt: dateTimeFormatter.format(session.createdAt),
              lastSeenAt: dateTimeFormatter.format(session.lastSeenAt),
              device: describeDevice(session.userAgent),
            }))}
          />
        </Section>

        <Section
          intro="Registramos el pedido y lo procesamos manualmente. No decimos que borramos nada hasta hacerlo."
          title="Dar de baja la cuenta"
        >
          <DeleteAccountSection
            requestedOn={user.deletionRequestedAt ? dateFormatter.format(user.deletionRequestedAt) : null}
          />
        </Section>

        <p className={styles.sectionIntro}>
          Consultá los{" "}
          <Link className={authStyles.link} href="/terminos">
            términos
          </Link>{" "}
          y la{" "}
          <Link className={authStyles.link} href="/privacidad">
            política de privacidad
          </Link>
          .
        </p>
      </div>
    </OperationalShell>
  );
}
